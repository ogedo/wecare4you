import type { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../lib/prisma";
import { TherapistProfileSchema } from "@wecare4you/types";

export class TherapistController {
  async list(req: FastifyRequest, reply: FastifyReply) {
    const { state, specialization, page = "1", limit = "20" } = req.query as Record<string, string>;

    const where: Record<string, unknown> = { isApproved: true };
    if (state) where.state = state;
    if (specialization) where.specializations = { has: specialization };

    const pageNum = parseInt(page, 10);
    const limitNum = Math.min(parseInt(limit, 10), 50);

    const [total, therapists] = await Promise.all([
      prisma.therapistProfile.count({ where }),
      prisma.therapistProfile.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        include: {
          user: { select: { id: true, phone: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return reply.send({
      success: true,
      data: therapists,
      meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    });
  }

  async getById(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    const therapist = await prisma.therapistProfile.findUnique({
      where: { id },
      include: { user: { select: { id: true, phone: true, email: true } } },
    });
    if (!therapist) return reply.code(404).send({ success: false, error: "Therapist not found" });
    return reply.send({ success: true, data: therapist });
  }

  async getAvailability(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    const therapist = await prisma.therapistProfile.findUnique({
      where: { id },
      select: { availability: true },
    });
    if (!therapist) return reply.code(404).send({ success: false, error: "Therapist not found" });
    return reply.send({ success: true, data: therapist.availability });
  }

  async updateProfile(req: FastifyRequest, reply: FastifyReply) {
    const body = TherapistProfileSchema.partial().safeParse(req.body);
    if (!body.success) {
      return reply.code(400).send({ success: false, error: body.error.flatten().fieldErrors });
    }
    const profile = await prisma.therapistProfile.update({
      where: { userId: req.user.sub },
      data: body.data,
    });
    return reply.send({ success: true, data: profile });
  }

  async updateAvailability(req: FastifyRequest, reply: FastifyReply) {
    const availability = req.body as Record<string, unknown>;
    const profile = await prisma.therapistProfile.update({
      where: { userId: req.user.sub },
      data: { availability },
    });
    return reply.send({ success: true, data: { availability: profile.availability } });
  }
}
