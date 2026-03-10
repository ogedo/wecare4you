import type { FastifyInstance } from "fastify";
import { authenticate, requireRole } from "../../plugins/auth";
import { CrisisController } from "./crisis.controller";

export async function crisisRoutes(app: FastifyInstance) {
  const ctrl = new CrisisController();

  // Counselor profile
  app.get("/me", { preHandler: requireRole("CRISIS_COUNSELOR") }, (req, reply) =>
    ctrl.getMyProfile(req, reply)
  );
  app.patch("/me", { preHandler: requireRole("CRISIS_COUNSELOR") }, (req, reply) =>
    ctrl.updateMyProfile(req, reply)
  );

  // Patient routes
  app.post("/sessions", { preHandler: requireRole("PATIENT") }, (req, reply) =>
    ctrl.initiate(req, reply)
  );
  app.get("/sessions/active", { preHandler: requireRole("PATIENT") }, (req, reply) =>
    ctrl.getActive(req, reply)
  );

  // Counselor routes
  app.post("/sessions/:id/accept", { preHandler: requireRole("CRISIS_COUNSELOR") }, (req, reply) =>
    ctrl.accept(req, reply)
  );
  app.get("/sessions/queue", { preHandler: requireRole("CRISIS_COUNSELOR") }, (req, reply) =>
    ctrl.getQueue(req, reply)
  );

  // Shared (patient or counselor)
  app.post("/sessions/:id/end", { preHandler: authenticate }, (req, reply) =>
    ctrl.end(req, reply)
  );
  app.get("/sessions/:id/messages", { preHandler: authenticate }, (req, reply) =>
    ctrl.getMessages(req, reply)
  );
}
