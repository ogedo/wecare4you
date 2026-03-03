import type { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../lib/prisma";

export class AdminController {
  async getStats(_req: FastifyRequest, reply: FastifyReply) {
    const [
      totalUsers,
      totalPatients,
      totalTherapists,
      totalBuddies,
      pendingApprovals,
      todaySessions,
      totalRevenue,
    ] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { role: "PATIENT", isActive: true } }),
      prisma.user.count({ where: { role: "THERAPIST", isActive: true } }),
      prisma.user.count({ where: { role: "TALK_BUDDY", isActive: true } }),
      prisma.therapistProfile.count({ where: { isApproved: false } }),
      prisma.session.count({
        where: { startedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      }),
      prisma.payment.aggregate({
        where: { status: "COMPLETED" },
        _sum: { platformFee: true, amount: true },
      }),
    ]);

    return reply.send({
      success: true,
      data: {
        totalUsers,
        totalPatients,
        totalTherapists,
        totalBuddies,
        pendingApprovals,
        todaySessions,
        totalRevenueKobo: totalRevenue._sum.amount ?? 0,
        totalCommissionKobo: totalRevenue._sum.platformFee ?? 0,
      },
    });
  }

  async listUsers(req: FastifyRequest, reply: FastifyReply) {
    const { role, page = "1", limit = "20" } = req.query as Record<string, string>;
    const pageNum = parseInt(page, 10);
    const limitNum = Math.min(parseInt(limit, 10), 50);
    const where = role ? { role: role as never } : {};

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        select: {
          id: true, phone: true, email: true, role: true,
          isVerified: true, isActive: true, createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return reply.send({
      success: true,
      data: users,
      meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    });
  }

  async approveTherapist(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    const therapist = await prisma.therapistProfile.update({
      where: { id },
      data: { isApproved: true },
    });
    return reply.send({ success: true, data: therapist });
  }

  async approveBuddy(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    const buddy = await prisma.buddyProfile.update({
      where: { id },
      data: { isApproved: true },
    });
    return reply.send({ success: true, data: buddy });
  }

  async getRevenue(req: FastifyRequest, reply: FastifyReply) {
    const { from, to } = req.query as { from?: string; to?: string };
    const dateFilter: Record<string, Date> = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);

    const payments = await prisma.payment.findMany({
      where: {
        status: "COMPLETED",
        ...(Object.keys(dateFilter).length && { paidAt: dateFilter }),
      },
      include: {
        appointment: {
          select: {
            therapistId: true,
            buddyId: true,
            scheduledAt: true,
          },
        },
      },
      orderBy: { paidAt: "desc" },
    });

    const totalAmount = payments.reduce((s, p) => s + p.amount, 0);
    const totalCommission = payments.reduce((s, p) => s + p.platformFee, 0);

    return reply.send({
      success: true,
      data: { payments, totalAmountKobo: totalAmount, totalCommissionKobo: totalCommission },
    });
  }

  async getPayouts(req: FastifyRequest, reply: FastifyReply) {
    const { page = "1", limit = "20" } = req.query as Record<string, string>;
    const pageNum = parseInt(page, 10);
    const limitNum = Math.min(parseInt(limit, 10), 50);

    const [total, payouts] = await Promise.all([
      prisma.payment.count({ where: { status: "COMPLETED" } }),
      prisma.payment.findMany({
        where: { status: "COMPLETED" },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        select: {
          id: true,
          appointmentId: true,
          amount: true,
          providerAmount: true,
          platformFee: true,
          currency: true,
          paidAt: true,
          payoutSentAt: true,
          paystackTransferId: true,
        },
        orderBy: { paidAt: "desc" },
      }),
    ]);

    return reply.send({
      success: true,
      data: payouts,
      meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    });
  }
}
