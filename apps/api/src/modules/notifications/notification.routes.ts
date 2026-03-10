import type { FastifyInstance } from "fastify";
import { authenticate } from "../../plugins/auth";
import { NotificationController } from "./notification.controller";

export async function notificationRoutes(app: FastifyInstance) {
  const ctrl = new NotificationController();

  app.get("/", { preHandler: authenticate }, (req, reply) => ctrl.list(req, reply));
  app.patch("/read-all", { preHandler: authenticate }, (req, reply) => ctrl.markAllRead(req, reply));
}
