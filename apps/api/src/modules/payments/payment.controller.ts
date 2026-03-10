import type { FastifyRequest, FastifyReply } from "fastify";
import type { Server } from "socket.io";
import crypto from "crypto";
import { prisma } from "../../lib/prisma";
import { env } from "../../lib/env";
import {
  initializeTransaction,
  verifyTransaction,
  createTransferRecipient,
  initiateTransfer,
  resolveAccountNumber,
  listBanks as paystackListBanks,
  generateReference,
} from "../../lib/paystack";
import { InitializePaymentSchema, OnboardBankSchema } from "@wecare4you/types";
import { NotificationService } from "../notifications/notification.service";

function formatNaira(kobo: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(kobo / 100);
}

export class PaymentController {
  async initialize(req: FastifyRequest, reply: FastifyReply) {
    const body = InitializePaymentSchema.safeParse(req.body);
    if (!body.success) {
      return reply.code(400).send({ success: false, error: body.error.flatten().fieldErrors });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: body.data.appointmentId },
      include: {
        therapist: true,
        buddy: true,
        patient: { include: { user: true } },
      },
    });

    if (!appointment) return reply.code(404).send({ success: false, error: "Appointment not found" });

    const existing = await prisma.payment.findUnique({
      where: { appointmentId: appointment.id },
    });
    if (existing && existing.status === "COMPLETED") {
      return reply.code(400).send({ success: false, error: "Appointment already paid" });
    }

    // Calculate amounts
    const rate = appointment.therapistId
      ? appointment.therapist!.sessionRate
      : appointment.buddy!.sessionRate;

    const commissionRate = appointment.therapistId
      ? env.THERAPIST_COMMISSION_RATE
      : env.BUDDY_COMMISSION_RATE;

    const platformFee = Math.round(rate * commissionRate);
    const providerAmount = rate - platformFee;

    const reference = generateReference("MC_PAY");
    const email = appointment.patient.user.email || `${appointment.patient.user.phone}@wecare4you.app`;

    const { authorizationUrl, accessCode } = await initializeTransaction({
      email,
      amountKobo: rate,
      reference,
      callbackUrl: `${env.FRONTEND_URL}/payment/verify?reference=${reference}`,
      metadata: {
        appointmentId: appointment.id,
        patientId: appointment.patientId,
        custom_fields: [
          { display_name: "Session Type", variable_name: "session_type", value: appointment.therapistId ? "Therapy" : "Talk Buddy" },
        ],
      },
    });

    // Upsert payment record
    const payment = await prisma.payment.upsert({
      where: { appointmentId: appointment.id },
      create: {
        appointmentId: appointment.id,
        paystackReference: reference,
        amount: rate,
        platformFee,
        providerAmount,
        currency: "NGN",
      },
      update: {
        paystackReference: reference,
        amount: rate,
        platformFee,
        providerAmount,
      },
    });

    return reply.send({
      success: true,
      data: { authorizationUrl, accessCode, reference, payment },
    });
  }

  async verify(req: FastifyRequest, reply: FastifyReply) {
    const { reference } = req.params as { reference: string };
    const result = await verifyTransaction(reference);

    if (result.paid) {
      await prisma.payment.update({
        where: { paystackReference: reference },
        data: { status: "COMPLETED", paidAt: new Date() },
      });
      const payment = await prisma.payment.findUnique({
        where: { paystackReference: reference },
        include: {
          appointment: {
            include: {
              patient: { include: { user: true } },
              therapist: { include: { user: true } },
              buddy: { include: { user: true } },
            },
          },
        },
      });
      if (payment) {
        await prisma.appointment.update({
          where: { id: payment.appointmentId },
          data: { status: "CONFIRMED" },
        });

        // N1 + N6: Notify patient and provider of confirmation
        const io = (req.server as unknown as { io: Server }).io;
        const appt = payment.appointment;
        const patientUser = appt.patient.user;
        const providerUser = appt.therapist?.user || appt.buddy?.user;
        const scheduledStr = appt.scheduledAt.toLocaleString("en-NG");

        await NotificationService.notify(io, {
          userId: patientUser.id,
          userEmail: patientUser.email ?? undefined,
          type: "APPOINTMENT_CONFIRMED_PATIENT",
          payload: { appointmentId: payment.appointmentId },
          emailSubject: "Your session is confirmed",
          emailHtml: `<p>Your session with <strong>${providerUser?.phone ?? "your provider"}</strong> is confirmed for ${scheduledStr}.</p>`,
        });

        if (providerUser) {
          await NotificationService.notify(io, {
            userId: providerUser.id,
            userEmail: providerUser.email ?? undefined,
            type: "APPOINTMENT_CONFIRMED_PROVIDER",
            payload: { appointmentId: payment.appointmentId },
            emailSubject: "Payment received — session confirmed",
            emailHtml: `<p>Payment received! Session with <strong>${patientUser.phone}</strong> on ${scheduledStr} confirmed. Earnings: <strong>${formatNaira(payment.providerAmount)}</strong></p>`,
          });
        }
      }
    }

    return reply.send({ success: true, data: { paid: result.paid, status: result.status } });
  }

  async webhook(req: FastifyRequest, reply: FastifyReply) {
    // Verify Paystack webhook signature
    const signature = req.headers["x-paystack-signature"] as string;
    const hash = crypto
      .createHmac("sha512", env.PAYSTACK_WEBHOOK_SECRET)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (hash !== signature) {
      return reply.code(401).send({ success: false, error: "Invalid webhook signature" });
    }

    const event = req.body as { event: string; data: Record<string, unknown> };

    if (event.event === "charge.success") {
      const reference = event.data.reference as string;
      const payment = await prisma.payment.findUnique({
        where: { paystackReference: reference },
        include: {
          appointment: {
            include: {
              patient: { include: { user: true } },
              therapist: { include: { user: true } },
              buddy: { include: { user: true } },
            },
          },
        },
      });

      if (payment && payment.status !== "COMPLETED") {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: "COMPLETED", paidAt: new Date() },
        });
        await prisma.appointment.update({
          where: { id: payment.appointmentId },
          data: { status: "CONFIRMED" },
        });

        // N1 + N6: Notify patient and provider
        const io = (req.server as unknown as { io: Server }).io;
        const appt = payment.appointment;
        const patientUser = appt.patient.user;
        const providerUser = appt.therapist?.user || appt.buddy?.user;
        const scheduledStr = appt.scheduledAt.toLocaleString("en-NG");

        await NotificationService.notify(io, {
          userId: patientUser.id,
          userEmail: patientUser.email ?? undefined,
          type: "APPOINTMENT_CONFIRMED_PATIENT",
          payload: { appointmentId: payment.appointmentId },
          emailSubject: "Your session is confirmed",
          emailHtml: `<p>Your session with <strong>${providerUser?.phone ?? "your provider"}</strong> is confirmed for ${scheduledStr}.</p>`,
        });

        if (providerUser) {
          await NotificationService.notify(io, {
            userId: providerUser.id,
            userEmail: providerUser.email ?? undefined,
            type: "APPOINTMENT_CONFIRMED_PROVIDER",
            payload: { appointmentId: payment.appointmentId },
            emailSubject: "Payment received — session confirmed",
            emailHtml: `<p>Payment received! Session with <strong>${patientUser.phone}</strong> on ${scheduledStr} confirmed. Earnings: <strong>${formatNaira(payment.providerAmount)}</strong></p>`,
          });
        }
      }
    }

    if (event.event === "transfer.success") {
      const transferCode = event.data.transfer_code as string;
      const payments = await prisma.payment.findMany({
        where: { paystackTransferId: transferCode },
        include: {
          appointment: {
            include: {
              therapist: { include: { user: true } },
              buddy: { include: { user: true } },
            },
          },
        },
      });

      await prisma.payment.updateMany({
        where: { paystackTransferId: transferCode },
        data: { payoutSentAt: new Date() },
      });

      // N8: Notify provider of successful payout
      const io = (req.server as unknown as { io: Server }).io;
      for (const payment of payments) {
        const providerUser =
          payment.appointment.therapist?.user || payment.appointment.buddy?.user;
        if (providerUser) {
          await NotificationService.notify(io, {
            userId: providerUser.id,
            userEmail: providerUser.email ?? undefined,
            type: "PAYOUT_SENT",
            payload: { amount: payment.providerAmount },
            emailSubject: "Your payout has been sent",
            emailHtml: `<p>Your payout of <strong>${formatNaira(payment.providerAmount)}</strong> has been sent to your bank account.</p>`,
          });
        }
      }
    }

    return reply.send({ received: true });
  }

  async triggerPayout(req: FastifyRequest, reply: FastifyReply) {
    const { appointmentId } = req.params as { appointmentId: string };

    const payment = await prisma.payment.findUnique({
      where: { appointmentId },
      include: {
        appointment: {
          include: {
            therapist: { include: { user: true } },
            buddy: { include: { user: true } },
          },
        },
      },
    });

    if (!payment) return reply.code(404).send({ success: false, error: "Payment not found" });
    if (payment.status !== "COMPLETED") {
      return reply.code(400).send({ success: false, error: "Payment not completed" });
    }
    if (payment.payoutSentAt) {
      return reply.code(400).send({ success: false, error: "Payout already sent" });
    }
    if (payment.providerAmount < env.MINIMUM_PAYOUT_KOBO) {
      return reply.code(400).send({ success: false, error: "Amount below minimum payout threshold" });
    }

    const providerUser =
      payment.appointment.therapist?.user || payment.appointment.buddy?.user;

    if (!providerUser?.paystackRecipientCode) {
      return reply.code(400).send({ success: false, error: "Provider has not set up payout account" });
    }

    const reference = generateReference("MC_PAYOUT");
    const transferCode = await initiateTransfer({
      recipientCode: providerUser.paystackRecipientCode,
      amountKobo: payment.providerAmount,
      reference,
      reason: `WeCare4You session payout - appointment ${appointmentId}`,
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: { paystackTransferId: transferCode },
    });

    // N8: Notify provider payout was initiated
    const io = (req.server as unknown as { io: Server }).io;
    await NotificationService.notify(io, {
      userId: providerUser.id,
      userEmail: providerUser.email ?? undefined,
      type: "PAYOUT_SENT",
      payload: { amount: payment.providerAmount, transferCode },
      emailSubject: "Your payout has been initiated",
      emailHtml: `<p>Your payout of <strong>${formatNaira(payment.providerAmount)}</strong> has been initiated and will arrive in your bank account shortly.</p>`,
    });

    return reply.send({ success: true, data: { transferCode, amount: payment.providerAmount } });
  }

  async listBanks(_req: FastifyRequest, reply: FastifyReply) {
    const banks = await paystackListBanks();
    return reply.send({ success: true, data: banks });
  }

  async onboardBank(req: FastifyRequest, reply: FastifyReply) {
    const body = OnboardBankSchema.safeParse(req.body);
    if (!body.success) {
      return reply.code(400).send({ success: false, error: body.error.flatten().fieldErrors });
    }

    const { accountName } = await resolveAccountNumber({
      accountNumber: body.data.accountNumber,
      bankCode: body.data.bankCode,
    });

    const recipientCode = await createTransferRecipient({
      accountNumber: body.data.accountNumber,
      bankCode: body.data.bankCode,
      name: accountName,
    });

    await prisma.user.update({
      where: { id: req.user.sub },
      data: {
        bankAccountNumber: body.data.accountNumber,
        bankCode: body.data.bankCode,
        paystackRecipientCode: recipientCode,
      },
    });

    return reply.send({ success: true, data: { accountName, recipientCode } });
  }
}
