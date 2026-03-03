import type { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../lib/prisma";
import { CreateAppointmentSchema, UpdateAppointmentStatusSchema } from "@wecare4you/types";

export class AppointmentController {
  async create(req: FastifyRequest, reply: FastifyReply) {
    if (req.user.role !== "PATIENT") {
      return reply.code(403).send({ success: false, error: "Only patients can book appointments" });
    }

    const body = CreateAppointmentSchema.safeParse(req.body);
    if (!body.success) {
      return reply.code(400).send({ success: false, error: body.error.flatten().fieldErrors });
    }

    const patient = await prisma.patientProfile.findUnique({ where: { userId: req.user.sub } });
    if (!patient) return reply.code(404).send({ success: false, error: "Patient profile not found" });

    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        therapistId: body.data.therapistId,
        buddyId: body.data.buddyId,
        scheduledAt: new Date(body.data.scheduledAt),
        duration: body.data.duration,
        type: body.data.type,
      },
      include: { patient: true, therapist: true, buddy: true },
    });

    return reply.code(201).send({ success: true, data: appointment });
  }

  async list(req: FastifyRequest, reply: FastifyReply) {
    const { page = "1", limit = "20", status } = req.query as Record<string, string>;
    const pageNum = parseInt(page, 10);
    const limitNum = Math.min(parseInt(limit, 10), 50);

    let where: Record<string, unknown> = {};

    if (req.user.role === "PATIENT") {
      const patient = await prisma.patientProfile.findUnique({ where: { userId: req.user.sub } });
      if (patient) where.patientId = patient.id;
    } else if (req.user.role === "THERAPIST") {
      const therapist = await prisma.therapistProfile.findUnique({ where: { userId: req.user.sub } });
      if (therapist) where.therapistId = therapist.id;
    } else if (req.user.role === "TALK_BUDDY") {
      const buddy = await prisma.buddyProfile.findUnique({ where: { userId: req.user.sub } });
      if (buddy) where.buddyId = buddy.id;
    }

    if (status) where.status = status;

    const [total, appointments] = await Promise.all([
      prisma.appointment.count({ where }),
      prisma.appointment.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        include: {
          patient: { include: { user: { select: { phone: true, email: true } } } },
          therapist: { include: { user: { select: { phone: true, email: true } } } },
          buddy: { include: { user: { select: { phone: true, email: true } } } },
          session: true,
          payment: { select: { paystackReference: true, amount: true, status: true } },
        },
        orderBy: { scheduledAt: "desc" },
      }),
    ]);

    return reply.send({
      success: true,
      data: appointments,
      meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    });
  }

  async getById(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: { include: { user: { select: { phone: true, email: true } } } },
        therapist: { include: { user: { select: { phone: true, email: true } } } },
        buddy: { include: { user: { select: { phone: true, email: true } } } },
        session: true,
        payment: true,
      },
    });
    if (!appointment) return reply.code(404).send({ success: false, error: "Appointment not found" });
    return reply.send({ success: true, data: appointment });
  }

  async updateStatus(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    const body = UpdateAppointmentStatusSchema.safeParse(req.body);
    if (!body.success) {
      return reply.code(400).send({ success: false, error: body.error.flatten().fieldErrors });
    }
    const appointment = await prisma.appointment.update({
      where: { id },
      data: { status: body.data.status },
    });
    return reply.send({ success: true, data: appointment });
  }

  async cancel(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    const appointment = await prisma.appointment.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
    return reply.send({ success: true, data: appointment });
  }
}
