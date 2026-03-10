import type { FastifyRequest, FastifyReply } from "fastify";
import type { Server } from "socket.io";
import { prisma } from "../../lib/prisma";
import { NotificationService } from "../notifications/notification.service";

export class ReviewController {
  async create(req: FastifyRequest, reply: FastifyReply) {
    const { appointmentId, rating, comment } = req.body as {
      appointmentId: string;
      rating: number;
      comment?: string;
    };

    if (!appointmentId || !rating || rating < 1 || rating > 5) {
      return reply.code(400).send({ success: false, error: "appointmentId and rating (1-5) required" });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: { include: { user: true } },
        therapist: { include: { user: true } },
        buddy: { include: { user: true } },
      },
    });

    if (!appointment) return reply.code(404).send({ success: false, error: "Appointment not found" });
    if (appointment.patient.userId !== req.user.sub) {
      return reply.code(403).send({ success: false, error: "Only the patient can review this appointment" });
    }
    if (appointment.status !== "COMPLETED") {
      return reply.code(400).send({ success: false, error: "Can only review completed appointments" });
    }

    const existing = await prisma.review.findUnique({ where: { appointmentId } });
    if (existing) return reply.code(409).send({ success: false, error: "Review already submitted" });

    const providerUser = appointment.therapist?.user || appointment.buddy?.user;
    if (!providerUser) {
      return reply.code(400).send({ success: false, error: "No provider on this appointment" });
    }

    const review = await prisma.review.create({
      data: {
        appointmentId,
        reviewerId: req.user.sub,
        revieweeId: providerUser.id,
        rating,
        comment,
      },
    });

    // Notify provider of new review
    const io = (req.server as unknown as { io: Server }).io;
    await NotificationService.notify(io, {
      userId: providerUser.id,
      userEmail: providerUser.email ?? undefined,
      type: "NEW_REVIEW",
      payload: { reviewId: review.id, rating },
      emailSubject: "You received a new review",
      emailHtml: `<p>A patient rated your session <strong>${rating}/5</strong>${comment ? `: "${comment}"` : ""}.</p>`,
    });

    return reply.code(201).send({ success: true, data: review });
  }

  async getProviderReviews(req: FastifyRequest, reply: FastifyReply) {
    const { userId } = req.params as { userId: string };

    const [reviews, aggregate] = await Promise.all([
      prisma.review.findMany({
        where: { revieweeId: userId },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.review.aggregate({
        where: { revieweeId: userId },
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ]);

    return reply.send({
      success: true,
      data: {
        reviews,
        avgRating: aggregate._avg.rating ? Math.round(aggregate._avg.rating * 10) / 10 : 0,
        count: aggregate._count.rating,
      },
    });
  }
}
