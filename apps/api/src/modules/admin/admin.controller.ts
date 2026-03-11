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

  async listTherapists(req: FastifyRequest, reply: FastifyReply) {
    const { status, page = "1", limit = "20" } = req.query as Record<string, string>;
    const pageNum = parseInt(page, 10);
    const limitNum = Math.min(parseInt(limit, 10), 50);
    const where = status === "pending" ? { isApproved: false } : status === "approved" ? { isApproved: true } : {};

    const [total, therapists] = await Promise.all([
      prisma.therapistProfile.count({ where }),
      prisma.therapistProfile.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        include: {
          user: { select: { id: true, phone: true, email: true, isActive: true, isVerified: true, createdAt: true } },
          _count: { select: { appointments: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const therapistIds = therapists.map((t) => t.id);
    const ratings = await prisma.review.groupBy({
      by: ["revieweeId"],
      where: { revieweeId: { in: therapists.map((t) => t.userId) } },
      _avg: { rating: true },
      _count: { rating: true },
    });
    const ratingMap = new Map(ratings.map((r) => [r.revieweeId, { avg: r._avg.rating, count: r._count.rating }]));

    const data = therapists.map((t) => ({
      ...t,
      avgRating: ratingMap.get(t.userId)?.avg ?? null,
      reviewCount: ratingMap.get(t.userId)?.count ?? 0,
      totalSessions: t._count.appointments,
    }));

    return reply.send({ success: true, data, meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) } });
  }

  async getTherapist(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    const therapist = await prisma.therapistProfile.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, phone: true, email: true, isActive: true, isVerified: true, createdAt: true } },
        _count: { select: { appointments: true } },
      },
    });
    if (!therapist) return reply.code(404).send({ success: false, error: "Therapist not found" });

    const rating = await prisma.review.aggregate({
      where: { revieweeId: therapist.userId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    return reply.send({
      success: true,
      data: {
        ...therapist,
        avgRating: rating._avg.rating ?? null,
        reviewCount: rating._count.rating,
        totalSessions: therapist._count.appointments,
      },
    });
  }

  async listBuddies(req: FastifyRequest, reply: FastifyReply) {
    const { status, page = "1", limit = "20" } = req.query as Record<string, string>;
    const pageNum = parseInt(page, 10);
    const limitNum = Math.min(parseInt(limit, 10), 50);
    const where = status === "pending" ? { isApproved: false } : status === "approved" ? { isApproved: true } : {};

    const [total, buddies] = await Promise.all([
      prisma.buddyProfile.count({ where }),
      prisma.buddyProfile.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        include: {
          user: { select: { id: true, phone: true, email: true, isActive: true, isVerified: true, createdAt: true } },
          _count: { select: { appointments: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const ratings = await prisma.review.groupBy({
      by: ["revieweeId"],
      where: { revieweeId: { in: buddies.map((b) => b.userId) } },
      _avg: { rating: true },
      _count: { rating: true },
    });
    const ratingMap = new Map(ratings.map((r) => [r.revieweeId, { avg: r._avg.rating, count: r._count.rating }]));

    const data = buddies.map((b) => ({
      ...b,
      avgRating: ratingMap.get(b.userId)?.avg ?? null,
      reviewCount: ratingMap.get(b.userId)?.count ?? 0,
      totalSessions: b._count.appointments,
    }));

    return reply.send({ success: true, data, meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) } });
  }

  async getBuddy(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    const buddy = await prisma.buddyProfile.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, phone: true, email: true, isActive: true, isVerified: true, createdAt: true } },
        _count: { select: { appointments: true } },
      },
    });
    if (!buddy) return reply.code(404).send({ success: false, error: "Talk Buddy not found" });

    const rating = await prisma.review.aggregate({
      where: { revieweeId: buddy.userId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    return reply.send({
      success: true,
      data: {
        ...buddy,
        avgRating: rating._avg.rating ?? null,
        reviewCount: rating._count.rating,
        totalSessions: buddy._count.appointments,
      },
    });
  }

  async getCrisisCounselor(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    const counselor = await prisma.crisisCounselorProfile.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, phone: true, email: true, isActive: true, isVerified: true, createdAt: true } },
        _count: { select: { sessions: true } },
      },
    });
    if (!counselor) return reply.code(404).send({ success: false, error: "Counselor not found" });

    return reply.send({
      success: true,
      data: { ...counselor, totalSessions: counselor._count.sessions },
    });
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

  async suspendUser(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    const user = await prisma.user.update({ where: { id }, data: { isActive: false }, select: { id: true, email: true, phone: true, role: true, isActive: true } });
    return reply.send({ success: true, data: user });
  }

  async reactivateUser(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    const user = await prisma.user.update({ where: { id }, data: { isActive: true }, select: { id: true, email: true, phone: true, role: true, isActive: true } });
    return reply.send({ success: true, data: user });
  }

  async listAdmins(_req: FastifyRequest, reply: FastifyReply) {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true, email: true, phone: true, adminTier: true, isActive: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });
    return reply.send({ success: true, data: admins });
  }

  async createAdmin(req: FastifyRequest, reply: FastifyReply) {
    const { email, phone, password, adminTier = "STANDARD" } = req.body as { email: string; phone: string; password: string; adminTier?: string };
    const bcrypt = await import("bcryptjs");
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, phone, passwordHash, role: "ADMIN", adminTier, isVerified: true },
      select: { id: true, email: true, phone: true, adminTier: true, createdAt: true },
    });
    return reply.code(201).send({ success: true, data: user });
  }

  async setAdminTier(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    const { tier } = req.body as { tier: string };
    if (!["STANDARD", "SUPER"].includes(tier)) return reply.code(400).send({ success: false, error: "Invalid tier. Use STANDARD or SUPER" });
    const user = await prisma.user.update({ where: { id, role: "ADMIN" }, data: { adminTier: tier }, select: { id: true, email: true, adminTier: true } });
    return reply.send({ success: true, data: user });
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
