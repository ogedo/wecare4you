import type { FastifyRequest, FastifyReply } from "fastify";
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
      // Confirm appointment
      const payment = await prisma.payment.findUnique({ where: { paystackReference: reference } });
      if (payment) {
        await prisma.appointment.update({
          where: { id: payment.appointmentId },
          data: { status: "CONFIRMED" },
        });
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
      const payment = await prisma.payment.findUnique({ where: { paystackReference: reference } });

      if (payment && payment.status !== "COMPLETED") {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: "COMPLETED", paidAt: new Date() },
        });
        await prisma.appointment.update({
          where: { id: payment.appointmentId },
          data: { status: "CONFIRMED" },
        });
      }
    }

    if (event.event === "transfer.success") {
      const transferCode = event.data.transfer_code as string;
      await prisma.payment.updateMany({
        where: { paystackTransferId: transferCode },
        data: { payoutSentAt: new Date() },
      });
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
