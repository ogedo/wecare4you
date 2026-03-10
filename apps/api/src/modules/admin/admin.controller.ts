import type { FastifyRequest, FastifyReply } from "fastify";
import type { Server } from "socket.io";
import { prisma } from "../../lib/prisma";
import { NotificationService } from "../notifications/notification.service";

export class AdminController {
  async getStats(_req: FastifyRequest, reply: FastifyReply) {
    const [
      totalUsers,
      totalPatients,
      totalTherapists,
      totalBuddies,
      pendingApprovals,
      pendingCounselorApprovals,
      todaySessions,
      totalRevenue,
    ] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { role: "PATIENT", isActive: true } }),
      prisma.user.count({ where: { role: "THERAPIST", isActive: true } }),
      prisma.user.count({ where: { role: "TALK_BUDDY", isActive: true } }),
      prisma.therapistProfile.count({ where: { isApproved: false } }),
      prisma.crisisCounselorProfile.count({ where: { isApproved: false } }),
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
        pendingCounselorApprovals,
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
      include: { user: true },
    });

    // N9: Notify provider their account is approved
    const io = (req.server as unknown as { io: Server }).io;
    await NotificationService.notify(io, {
      userId: therapist.userId,
      userEmail: therapist.user.email ?? undefined,
      type: "ACCOUNT_APPROVED",
      payload: { role: "THERAPIST" },
      emailSubject: "Your WeCare4You account has been approved",
      emailHtml: `<p>Congratulations! Your WeCare4You therapist account has been approved. You're now visible to patients and can start accepting bookings.</p>`,
    });

    return reply.send({ success: true, data: therapist });
  }

  async listCrisisCounselors(_req: FastifyRequest, reply: FastifyReply) {
    const counselors = await prisma.crisisCounselorProfile.findMany({
      include: {
        user: { select: { id: true, phone: true, email: true, createdAt: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return reply.send({ success: true, data: counselors });
  }

  async approveCrisisCounselor(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    const counselor = await prisma.crisisCounselorProfile.update({
      where: { id },
      data: { isApproved: true },
      include: { user: true },
    });

    const io = (req.server as unknown as { io: Server }).io;
    await NotificationService.notify(io, {
      userId: counselor.userId,
      userEmail: counselor.user.email ?? undefined,
      type: "ACCOUNT_APPROVED",
      payload: { role: "CRISIS_COUNSELOR" },
      emailSubject: "Your WeCare4You account has been approved",
      emailHtml: `<p>Your WeCare4You Crisis Counselor account has been approved. You can now accept crisis sessions from patients.</p>`,
    });

    return reply.send({ success: true, data: counselor });
  }

  async approveBuddy(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    const buddy = await prisma.buddyProfile.update({
      where: { id },
      data: { isApproved: true },
      include: { user: true },
    });

    // N9: Notify provider their account is approved
    const io = (req.server as unknown as { io: Server }).io;
    await NotificationService.notify(io, {
      userId: buddy.userId,
      userEmail: buddy.user.email ?? undefined,
      type: "ACCOUNT_APPROVED",
      payload: { role: "TALK_BUDDY" },
      emailSubject: "Your WeCare4You account has been approved",
      emailHtml: `<p>Congratulations! Your WeCare4You Talk Buddy account has been approved. You're now visible to patients and can start accepting bookings.</p>`,
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

    const totalAmount = payments.reduce((s: number, p: { amount: number }) => s + p.amount, 0);
    const totalCommission = payments.reduce((s: number, p: { platformFee: number }) => s + p.platformFee, 0);

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

  async getAnalytics(req: FastifyRequest, reply: FastifyReply) {
    const { period = "30d" } = req.query as { period?: string };
    const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Revenue by day
    const payments = await prisma.payment.findMany({
      where: { status: "COMPLETED", paidAt: { gte: from } },
      select: { paidAt: true, amount: true, platformFee: true },
    });

    const revenueMap = new Map<string, { total: number; commission: number }>();
    for (const p of payments) {
      if (!p.paidAt) continue;
      const dateKey = p.paidAt.toISOString().slice(0, 10);
      const existing = revenueMap.get(dateKey) ?? { total: 0, commission: 0 };
      revenueMap.set(dateKey, {
        total: existing.total + p.amount,
        commission: existing.commission + p.platformFee,
      });
    }
    const revenueByDay = [...revenueMap.entries()]
      .map(([date, v]) => ({ date, ...v }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Sessions by day
    const sessions = await prisma.session.findMany({
      where: { startedAt: { gte: from } },
      select: { startedAt: true },
    });

    const sessionsMap = new Map<string, number>();
    for (const s of sessions) {
      if (!s.startedAt) continue;
      const dateKey = s.startedAt.toISOString().slice(0, 10);
      sessionsMap.set(dateKey, (sessionsMap.get(dateKey) ?? 0) + 1);
    }
    const sessionsByDay = [...sessionsMap.entries()]
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Appointment status breakdown
    const statusGroups = await prisma.appointment.groupBy({
      by: ["status"],
      _count: { status: true },
    });
    const appointmentsByStatus: Record<string, number> = {};
    for (const g of statusGroups) {
      appointmentsByStatus[g.status] = g._count.status;
    }

    // Top providers by completed sessions in period
    const completedAppts = await prisma.appointment.findMany({
      where: { status: "COMPLETED", createdAt: { gte: from } },
      include: {
        therapist: { include: { user: { select: { id: true, email: true, phone: true } } } },
        buddy: { include: { user: { select: { id: true, email: true, phone: true } } } },
        payment: { select: { providerAmount: true } },
      },
    });

    const providerMap = new Map<string, { name: string; sessions: number; earnings: number }>();
    for (const appt of completedAppts) {
      const user = appt.therapist?.user || appt.buddy?.user;
      if (!user) continue;
      const existing = providerMap.get(user.id) ?? {
        name: user.email || user.phone,
        sessions: 0,
        earnings: 0,
      };
      providerMap.set(user.id, {
        name: existing.name,
        sessions: existing.sessions + 1,
        earnings: existing.earnings + (appt.payment?.providerAmount ?? 0),
      });
    }
    const topProviders = [...providerMap.values()]
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 10);

    return reply.send({
      success: true,
      data: { revenueByDay, sessionsByDay, topProviders, appointmentsByStatus },
    });
  }
}
