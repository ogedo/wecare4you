import type { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../lib/prisma";
import { BuddyProfileSchema } from "@wecare4you/types";

const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export class BuddyController {
  async list(req: FastifyRequest, reply: FastifyReply) {
    const { page = "1", limit = "20", maxRate, minRate } = req.query as Record<string, string>;
    const pageNum = parseInt(page, 10);
    const limitNum = Math.min(parseInt(limit, 10), 50);

    const where: Record<string, unknown> = { isApproved: true };
    if (maxRate || minRate) {
      const rateFilter: Record<string, number> = {};
      if (maxRate) rateFilter.lte = parseInt(maxRate, 10);
      if (minRate) rateFilter.gte = parseInt(minRate, 10);
      where.sessionRate = rateFilter;
    }

    const [total, buddies] = await Promise.all([
      prisma.buddyProfile.count({ where }),
      prisma.buddyProfile.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        include: { user: { select: { id: true, phone: true, email: true } } },
      }),
    ]);

    // Augment with avg ratings
    const userIds = buddies.map((b: { user: { id: string } }) => b.user.id);
    const ratingsAgg = await prisma.review.groupBy({
      by: ["revieweeId"],
      where: { revieweeId: { in: userIds } },
      _avg: { rating: true },
      _count: { rating: true },
    });
    const ratingsMap = new Map(
      ratingsAgg.map((r: { revieweeId: string; _avg: { rating: number | null }; _count: { rating: number } }) => [
        r.revieweeId,
        { avgRating: r._avg.rating ?? 0, reviewCount: r._count.rating },
      ])
    );

    const data = buddies.map((b: { user: { id: string } }) => ({
      ...b,
      avgRating: ratingsMap.get(b.user.id)?.avgRating ?? 0,
      reviewCount: ratingsMap.get(b.user.id)?.reviewCount ?? 0,
    }));

    return reply.send({
      success: true,
      data,
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

  async getSlots(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    const { date, duration = "30" } = req.query as { date?: string; duration?: string };

    if (!date) {
      return reply.code(400).send({ success: false, error: "date query param required (YYYY-MM-DD)" });
    }

    const buddy = await prisma.buddyProfile.findUnique({
      where: { id },
      select: { availability: true },
    });
    if (!buddy) return reply.code(404).send({ success: false, error: "Talk Buddy not found" });

    const targetDate = new Date(date);
    const dayKey = DAY_NAMES[targetDate.getDay()];
    const availability = buddy.availability as Record<string, string[]>;
    const times = availability[dayKey] ?? [];
    const durationMin = parseInt(duration, 10);

    const slots = await Promise.all(
      times.map(async (time) => {
        const [hours, minutes] = time.split(":").map(Number);
        const slotStart = new Date(date);
        slotStart.setHours(hours, minutes, 0, 0);
        const slotEnd = new Date(slotStart.getTime() + durationMin * 60 * 1000);

        const conflict = await prisma.appointment.findFirst({
          where: {
            buddyId: id,
            status: { not: "CANCELLED" },
            scheduledAt: { gte: slotStart, lt: slotEnd },
          },
        });

        return { time, available: !conflict };
      })
    );

    return reply.send({ success: true, data: slots });
  }

  async getMyProfile(req: FastifyRequest, reply: FastifyReply) {
    const profile = await prisma.buddyProfile.findUnique({
      where: { userId: req.user.sub },
      include: { user: { select: { id: true, phone: true, email: true } } },
    });
    if (!profile) return reply.code(404).send({ success: false, error: "Profile not found" });
    return reply.send({ success: true, data: profile });
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
    const availability = req.body as never;
    const profile = await prisma.buddyProfile.update({
      where: { userId: req.user.sub },
      data: { availability },
    });
    return reply.send({ success: true, data: { availability: profile.availability } });
  }
}
