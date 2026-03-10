import type { FastifyRequest, FastifyReply } from "fastify";
import type { Server } from "socket.io";
import { prisma } from "../../lib/prisma";
import { createRoom, createMeetingToken, deleteRoom } from "../../lib/daily";
import { NotificationService } from "../notifications/notification.service";

export class SessionController {
  async start(req: FastifyRequest, reply: FastifyReply) {
    const { appointmentId } = req.params as { appointmentId: string };

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: { include: { user: true } },
        therapist: { include: { user: true } },
        buddy: { include: { user: true } },
        payment: true,
      },
    });

    if (!appointment) return reply.code(404).send({ success: false, error: "Appointment not found" });
    if (appointment.status !== "CONFIRMED") {
      return reply.code(400).send({ success: false, error: "Appointment must be confirmed before starting" });
    }
    if (!appointment.payment || appointment.payment.status !== "COMPLETED") {
      return reply.code(402).send({ success: false, error: "Payment required before session can start" });
    }

    const existing = await prisma.session.findUnique({ where: { appointmentId } });
    if (existing) return reply.send({ success: true, data: existing });

    const roomName = `mc_${appointmentId.slice(0, 8)}_${Date.now()}`;
    const room = await createRoom(roomName);

    const session = await prisma.session.create({
      data: {
        appointmentId,
        dailyRoomName: room.name,
        dailyRoomUrl: room.url,
        startedAt: new Date(),
      },
    });

    return reply.code(201).send({ success: true, data: session });
  }

  async getToken(req: FastifyRequest, reply: FastifyReply) {
    const { appointmentId } = req.params as { appointmentId: string };

    const session = await prisma.session.findUnique({ where: { appointmentId } });
    if (!session) return reply.code(404).send({ success: false, error: "Session not found" });

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        therapist: { include: { user: true } },
        buddy: { include: { user: true } },
      },
    });

    if (!appointment) return reply.code(404).send({ success: false, error: "Appointment not found" });

    const isOwner =
      appointment.therapist?.userId === req.user.sub ||
      appointment.buddy?.userId === req.user.sub;

    const token = await createMeetingToken({
      roomName: session.dailyRoomName,
      userId: req.user.sub,
      userName: req.user.sub,
      isOwner,
      expirySeconds: appointment.duration * 60 + 600,
    });

    return reply.send({
      success: true,
      data: {
        token,
        roomUrl: session.dailyRoomUrl,
        roomName: session.dailyRoomName,
        startedAt: session.startedAt,
      },
    });
  }

  async end(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    const session = await prisma.session.update({
      where: { id },
      data: { endedAt: new Date() },
    });

    // Mark appointment completed and fetch patient info for notification
    const appointment = await prisma.appointment.update({
      where: { id: session.appointmentId },
      data: { status: "COMPLETED" },
      include: {
        patient: { include: { user: true } },
        therapist: { include: { user: true } },
        buddy: { include: { user: true } },
      },
    });

    // Clean up Daily.co room
    await deleteRoom(session.dailyRoomName).catch(() => {});

    // N3: Notify patient that session ended with rating CTA
    const io = (req.server as unknown as { io: Server }).io;
    const patientUser = appointment.patient.user;
    const providerUser = appointment.therapist?.user || appointment.buddy?.user;
    const providerName = providerUser?.phone ?? "your provider";

    await NotificationService.notify(io, {
      userId: patientUser.id,
      userEmail: patientUser.email ?? undefined,
      type: "SESSION_ENDED",
      payload: { appointmentId: appointment.id },
      emailSubject: "Your session is complete",
      emailHtml: `<p>Your session with <strong>${providerName}</strong> is complete. Open the app to rate your experience.</p>`,
    });

    return reply.send({ success: true, data: session });
  }
}
