import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { authenticate } from "../../plugins/auth";
import { MessageController } from "./message.controller";
import { prisma } from "../../lib/prisma";

async function checkConversationParticipant(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const convo = await prisma.conversation.findUnique({ where: { id } });
  if (!convo) return reply.code(404).send({ success: false, error: "Conversation not found" });

  const userId = req.user.sub;
  const patient = await prisma.patientProfile.findUnique({ where: { userId } });
  const isParticipant =
    (patient !== null && convo.patientId === patient.id) ||
    convo.providerId === userId ||
    req.user.role === "ADMIN";

  if (!isParticipant) return reply.code(403).send({ success: false, error: "Forbidden" });
}

export async function messageRoutes(app: FastifyInstance) {
  const ctrl = new MessageController();

  app.get("/conversations", { preHandler: authenticate }, (req, reply) =>
    ctrl.listConversations(req, reply)
  );
  app.post("/conversations", { preHandler: authenticate }, (req, reply) =>
    ctrl.createConversation(req, reply)
  );
  app.get("/conversations/:id/messages", { preHandler: [authenticate, checkConversationParticipant] }, (req, reply) =>
    ctrl.getMessages(req, reply)
  );
  app.post("/conversations/:id/messages", { preHandler: [authenticate, checkConversationParticipant] }, (req, reply) =>
    ctrl.sendMessage(req, reply)
  );
}
