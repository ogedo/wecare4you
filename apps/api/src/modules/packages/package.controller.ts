import type { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../lib/prisma";
import { env } from "../../lib/env";
import {
  initializeTransaction,
  verifyTransaction,
  generateReference,
} from "../../lib/paystack";

export class PackageController {
  // Public: list active packages for a provider
  async list(req: FastifyRequest, reply: FastifyReply) {
    const { providerId, providerType } = req.query as Record<string, string>;
    const where: Record<string, unknown> = { isActive: true };
    if (providerId) where.providerId = providerId;
    if (providerType) where.providerType = providerType;

    const packages = await prisma.sessionPackage.findMany({
      where,
      orderBy: { priceKobo: "asc" },
    });
    return reply.send({ success: true, data: packages });
  }

  // Provider: create a package for themselves
  async create(req: FastifyRequest, reply: FastifyReply) {
    const role = req.user.role;
    if (role !== "THERAPIST" && role !== "TALK_BUDDY") {
      return reply.code(403).send({ success: false, error: "Only providers can create packages" });
    }

    const { name, sessions, priceKobo } = req.body as {
      name: string;
      sessions: number;
      priceKobo: number;
    };

    if (!name || !sessions || !priceKobo) {
      return reply.code(400).send({ success: false, error: "name, sessions and priceKobo are required" });
    }

    const pkg = await prisma.sessionPackage.create({
      data: {
        providerId: req.user.sub,
        providerType: role,
        name,
        sessions,
        priceKobo,
      },
    });
    return reply.code(201).send({ success: true, data: pkg });
  }

  // Provider: deactivate a package
  async deactivate(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    const pkg = await prisma.sessionPackage.findUnique({ where: { id } });
    if (!pkg) return reply.code(404).send({ success: false, error: "Package not found" });
    if (pkg.providerId !== req.user.sub) {
      return reply.code(403).send({ success: false, error: "Not authorised" });
    }
    await prisma.sessionPackage.update({ where: { id }, data: { isActive: false } });
    return reply.send({ success: true });
  }

  // Patient: initiate purchase → return Paystack URL
  async purchase(req: FastifyRequest, reply: FastifyReply) {
    if (req.user.role !== "PATIENT") {
      return reply.code(403).send({ success: false, error: "Only patients can purchase packages" });
    }

    const { id } = req.params as { id: string };
    const pkg = await prisma.sessionPackage.findUnique({ where: { id } });
    if (!pkg || !pkg.isActive) {
      return reply.code(404).send({ success: false, error: "Package not found or inactive" });
    }

    const patient = await prisma.patientProfile.findUnique({
      where: { userId: req.user.sub },
      include: { user: true },
    });
    if (!patient) return reply.code(404).send({ success: false, error: "Patient profile not found" });

    const reference = generateReference("PKG_PAY");
    const email = patient.user.email || `${patient.user.phone}@wecare4you.app`;

    const { authorizationUrl } = await initializeTransaction({
      email,
      amountKobo: pkg.priceKobo,
      reference,
      callbackUrl: `${env.FRONTEND_URL}/payment/verify?reference=${reference}&type=package`,
      metadata: {
        packageId: pkg.id,
        patientId: req.user.sub,
        custom_fields: [
          { display_name: "Package", variable_name: "package_name", value: pkg.name },
        ],
      },
    });

    // Create PatientPackage in PENDING state
    const purchase = await prisma.patientPackage.create({
      data: {
        packageId: pkg.id,
        patientId: patient.id,
        remainingSessions: pkg.sessions,
        paystackReference: reference,
        status: "PENDING",
      },
    });

    return reply.send({ success: true, data: { authorizationUrl, purchaseId: purchase.id, reference } });
  }

  // Patient: verify purchase after Paystack redirect
  async verify(req: FastifyRequest, reply: FastifyReply) {
    const { reference } = req.query as { reference?: string };
    if (!reference) return reply.code(400).send({ success: false, error: "reference is required" });

    const purchase = await prisma.patientPackage.findUnique({ where: { paystackReference: reference } });
    if (!purchase) return reply.code(404).send({ success: false, error: "Purchase not found" });
    if (purchase.status === "ACTIVE") {
      return reply.send({ success: true, data: purchase });
    }

    const txn = await verifyTransaction(reference);
    if (txn.status !== "success") {
      return reply.code(402).send({ success: false, error: "Payment not successful" });
    }

    const updated = await prisma.patientPackage.update({
      where: { id: purchase.id },
      data: { status: "ACTIVE", purchasedAt: new Date() },
    });

    return reply.send({ success: true, data: updated });
  }

  // Patient: get own active/pending packages
  async mine(req: FastifyRequest, reply: FastifyReply) {
    if (req.user.role !== "PATIENT") {
      return reply.code(403).send({ success: false, error: "Patients only" });
    }

    const patient = await prisma.patientProfile.findUnique({ where: { userId: req.user.sub } });
    if (!patient) return reply.code(404).send({ success: false, error: "Patient profile not found" });

    const purchases = await prisma.patientPackage.findMany({
      where: { patientId: patient.id, status: { in: ["ACTIVE", "PENDING"] } },
      include: { package: true },
      orderBy: { purchasedAt: "desc" },
    });

    return reply.send({ success: true, data: purchases });
  }
}
