import type { FastifyInstance } from "fastify";
import { authenticate } from "../../plugins/auth";
import { SessionController } from "./session.controller";

export async function sessionRoutes(app: FastifyInstance) {
  const ctrl = new SessionController();

  app.post("/:appointmentId/start", { preHandler: authenticate }, (req, reply) =>
    ctrl.start(req, reply)
  );
  app.get("/:appointmentId/token", { preHandler: authenticate }, (req, reply) =>
    ctrl.getToken(req, reply)
  );
  app.patch("/:id/end", { preHandler: authenticate }, (req, reply) => ctrl.end(req, reply));
}
