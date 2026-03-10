import type { FastifyRequest, FastifyReply } from "fastify";
import type { Server } from "socket.io";
import { prisma } from "../../lib/prisma";
import { NotificationService } from "../notifications/notification.service";

export class CrisisController {
  // Patient: initiate a crisis session
  async initiate(req: FastifyRequest, reply: FastifyReply) {
    if (req.user.role !== "PATIENT") {
      return reply.code(403).send({ success: false, error: "Only patients can initiate crisis sessions" });
    }

    // Check if patient already has an active/waiting session
    const existing = await prisma.crisisSession.findFirst({
      where: {
        patientId: req.user.sub,
        status: { in: ["WAITING", "ACTIVE"] },
      },
    });
    if (existing) {
      return reply.send({ success: true, data: existing });
    }

    const session = await prisma.crisisSession.create({
      data: { patientId: req.user.sub },
      include: { patient: { select: { phone: true, email: true } } },
    });

    // Emit to all online crisis counselors
    const io = (req.server as unknown as { io: Server }).io;
    io.to("counselors:online").emit("crisis:incoming", {
      sessionId: session.id,
      createdAt: session.createdAt,
    });

    return reply.code(201).send({ success: true, data: session });
  }

  // Counselor: accept a waiting crisis session
  async accept(req: FastifyRequest, reply: FastifyReply) {
    if (req.user.role !== "CRISIS_COUNSELOR") {
      return reply.code(403).send({ success: false, error: "Only crisis counselors can accept sessions" });
    }

    const { id } = req.params as { id: string };

    const counselorProfile = await prisma.crisisCounselorProfile.findUnique({
      where: { userId: req.user.sub },
    });
    if (!counselorProfile || !counselorProfile.isApproved) {
      return reply.code(403).send({ success: false, error: "Counselor account not approved" });
    }

    const session = await prisma.crisisSession.findUnique({ where: { id } });
    if (!session) return reply.code(404).send({ success: false, error: "Session not found" });
    if (session.status !== "WAITING") {
      return reply.code(409).send({ success: false, error: "Session is no longer available" });
    }

    const updated = await prisma.crisisSession.update({
      where: { id },
      data: {
        counselorId: counselorProfile.id,
        status: "ACTIVE",
        startedAt: new Date(),
      },
    });

    // Notify the patient their counselor has connected
    const io = (req.server as unknown as { io: Server }).io;
    io.to(`user:${session.patientId}`).emit("crisis:accepted", {
      sessionId: id,
      counselorId: req.user.sub,
    });

    // Also notify the patient via in-app notification
    await NotificationService.notify(io, {
      userId: session.patientId,
      type: "CRISIS_COUNSELOR_JOINED",
      payload: { sessionId: id },
    });

    return reply.send({ success: true, data: updated });
  }

  // Either party: end a crisis session
  async end(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };

    const session = await prisma.crisisSession.findUnique({ where: { id } });
    if (!session) return reply.code(404).send({ success: false, error: "Session not found" });

    // Only patient or the assigned counselor can end
    const counselorProfile = req.user.role === "CRISIS_COUNSELOR"
      ? await prisma.crisisCounselorProfile.findUnique({ where: { userId: req.user.sub } })
      : null;

    const isPatient = req.user.sub === session.patientId;
    const isCounselor = counselorProfile && session.counselorId === counselorProfile.id;

    if (!isPatient && !isCounselor) {
      return reply.code(403).send({ success: false, error: "Not authorised to end this session" });
    }

    const updated = await prisma.crisisSession.update({
      where: { id },
      data: { status: "ENDED", endedAt: new Date() },
    });

    // Notify the other party
    const io = (req.server as unknown as { io: Server }).io;
    io.to(`crisis:${id}`).emit("crisis:ended", { sessionId: id });

    return reply.send({ success: true, data: updated });
  }

  // Patient: get their current active/waiting session
  async getActive(req: FastifyRequest, reply: FastifyReply) {
    const session = await prisma.crisisSession.findFirst({
      where: {
        patientId: req.user.sub,
        status: { in: ["WAITING", "ACTIVE"] },
      },
      include: {
        messages: { orderBy: { sentAt: "asc" } },
        counselor: { select: { id: true, bio: true } },
      },
    });
    return reply.send({ success: true, data: session });
  }

  // Counselor: get all WAITING sessions queue
  async getQueue(_req: FastifyRequest, reply: FastifyReply) {
    const sessions = await prisma.crisisSession.findMany({
      where: { status: "WAITING" },
      include: {
        patient: { select: { phone: true } },
      },
      orderBy: { createdAt: "asc" },
    });
    return reply.send({ success: true, data: sessions });
  }

  // Counselor: get own profile
  async getMyProfile(req: FastifyRequest, reply: FastifyReply) {
    const profile = await prisma.crisisCounselorProfile.findUnique({
      where: { userId: req.user.sub },
      include: { user: { select: { id: true, phone: true, email: true } } },
    });
    if (!profile) return reply.code(404).send({ success: false, error: "Profile not found" });
    return reply.send({ success: true, data: profile });
  }

  // Counselor: update bio
  async updateMyProfile(req: FastifyRequest, reply: FastifyReply) {
    const { bio } = req.body as { bio?: string };
    const profile = await prisma.crisisCounselorProfile.update({
      where: { userId: req.user.sub },
      data: { bio: bio ?? "" },
    });
    return reply.send({ success: true, data: profile });
  }

  // Get messages for a crisis session
  async getMessages(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };

    const session = await prisma.crisisSession.findUnique({ where: { id } });
    if (!session) return reply.code(404).send({ success: false, error: "Session not found" });

    // Verify caller is patient or assigned counselor
    const counselorProfile = req.user.role === "CRISIS_COUNSELOR"
      ? await prisma.crisisCounselorProfile.findUnique({ where: { userId: req.user.sub } })
      : null;

    const isPatient = req.user.sub === session.patientId;
    const isCounselor = counselorProfile && session.counselorId === counselorProfile.id;

    if (!isPatient && !isCounselor) {
      return reply.code(403).send({ success: false, error: "Not authorised" });
    }

    const messages = await prisma.crisisMessage.findMany({
      where: { crisisSessionId: id },
      orderBy: { sentAt: "asc" },
    });

    return reply.send({ success: true, data: messages });
  }
}
