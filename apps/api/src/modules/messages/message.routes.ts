import type { FastifyInstance } from "fastify";
import { authenticate } from "../../plugins/auth";
import { MessageController } from "./message.controller";

export async function messageRoutes(app: FastifyInstance) {
  const ctrl = new MessageController();

  app.get("/conversations", { preHandler: authenticate }, (req, reply) =>
    ctrl.listConversations(req, reply)
  );
  app.post("/conversations", { preHandler: authenticate }, (req, reply) =>
    ctrl.createConversation(req, reply)
  );
  app.get("/conversations/:id/messages", { preHandler: authenticate }, (req, reply) =>
    ctrl.getMessages(req, reply)
  );
  app.post("/conversations/:id/messages", { preHandler: authenticate }, (req, reply) =>
    ctrl.sendMessage(req, reply)
  );
}
