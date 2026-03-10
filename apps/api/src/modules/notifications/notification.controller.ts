import type { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../lib/prisma";

export class NotificationController {
  async list(req: FastifyRequest, reply: FastifyReply) {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.sub },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return reply.send({ success: true, data: notifications });
  }

  async markAllRead(req: FastifyRequest, reply: FastifyReply) {
    await prisma.notification.updateMany({
      where: { userId: req.user.sub, isRead: false },
      data: { isRead: true },
    });
    return reply.send({ success: true });
  }
}
