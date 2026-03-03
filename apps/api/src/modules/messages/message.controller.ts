import type { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../lib/prisma";
import { SendMessageSchema, CreateConversationSchema } from "@wecare4you/types";

export class MessageController {
  async listConversations(req: FastifyRequest, reply: FastifyReply) {
    const userId = req.user.sub;
    let conversations;

    if (req.user.role === "PATIENT") {
      const patient = await prisma.patientProfile.findUnique({ where: { userId } });
      conversations = await prisma.conversation.findMany({
        where: { patientId: patient?.id },
        include: {
          messages: { orderBy: { sentAt: "desc" }, take: 1 },
        },
        orderBy: { createdAt: "desc" },
      });
    } else {
      conversations = await prisma.conversation.findMany({
        where: { providerId: userId },
        include: {
          messages: { orderBy: { sentAt: "desc" }, take: 1 },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    return reply.send({ success: true, data: conversations });
  }

  async createConversation(req: FastifyRequest, reply: FastifyReply) {
    const body = CreateConversationSchema.safeParse(req.body);
    if (!body.success) {
      return reply.code(400).send({ success: false, error: body.error.flatten().fieldErrors });
    }

    const patient = await prisma.patientProfile.findUnique({ where: { userId: req.user.sub } });
    if (!patient) return reply.code(403).send({ success: false, error: "Only patients can start conversations" });

    const conversation = await prisma.conversation.upsert({
      where: { patientId_providerId: { patientId: patient.id, providerId: body.data.providerId } },
      create: { patientId: patient.id, providerId: body.data.providerId },
      update: {},
    });

    return reply.code(201).send({ success: true, data: conversation });
  }

  async getMessages(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    const { page = "1", limit = "50" } = req.query as Record<string, string>;
    const pageNum = parseInt(page, 10);
    const limitNum = Math.min(parseInt(limit, 10), 100);

    const [total, messages] = await Promise.all([
      prisma.message.count({ where: { conversationId: id } }),
      prisma.message.findMany({
        where: { conversationId: id },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { sentAt: "asc" },
      }),
    ]);

    return reply.send({
      success: true,
      data: messages,
      meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    });
  }

  async sendMessage(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    const body = SendMessageSchema.safeParse(req.body);
    if (!body.success) {
      return reply.code(400).send({ success: false, error: body.error.flatten().fieldErrors });
    }

    const message = await prisma.message.create({
      data: {
        conversationId: id,
        senderId: req.user.sub,
        content: body.data.content,
      },
    });

    return reply.code(201).send({ success: true, data: message });
  }
}
