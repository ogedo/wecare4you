import type { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../lib/prisma";
import { BuddyProfileSchema } from "@wecare4you/types";

export class BuddyController {
  async list(req: FastifyRequest, reply: FastifyReply) {
    const { page = "1", limit = "20" } = req.query as Record<string, string>;
    const pageNum = parseInt(page, 10);
    const limitNum = Math.min(parseInt(limit, 10), 50);

    const [total, buddies] = await Promise.all([
      prisma.buddyProfile.count({ where: { isApproved: true } }),
      prisma.buddyProfile.findMany({
        where: { isApproved: true },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        include: { user: { select: { id: true, phone: true, email: true } } },
      }),
    ]);

    return reply.send({
      success: true,
      data: buddies,
      meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    });
  }

  async getById(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    const buddy = await prisma.buddyProfile.findUnique({
      where: { id },
      include: { user: { select: { id: true, phone: true, email: true } } },
    });
    if (!buddy) return reply.code(404).send({ success: false, error: "Talk Buddy not found" });
    return reply.send({ success: true, data: buddy });
  }

  async getAvailability(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    const buddy = await prisma.buddyProfile.findUnique({
      where: { id },
      select: { availability: true },
    });
    if (!buddy) return reply.code(404).send({ success: false, error: "Talk Buddy not found" });
    return reply.send({ success: true, data: buddy.availability });
  }

  async updateProfile(req: FastifyRequest, reply: FastifyReply) {
    const body = BuddyProfileSchema.partial().safeParse(req.body);
    if (!body.success) {
      return reply.code(400).send({ success: false, error: body.error.flatten().fieldErrors });
    }
    const profile = await prisma.buddyProfile.update({
      where: { userId: req.user.sub },
      data: body.data,
    });
    return reply.send({ success: true, data: profile });
  }

  async updateAvailability(req: FastifyRequest, reply: FastifyReply) {
    const availability = req.body as Record<string, unknown>;
    const profile = await prisma.buddyProfile.update({
      where: { userId: req.user.sub },
      data: { availability },
    });
    return reply.send({ success: true, data: { availability: profile.availability } });
  }
}
