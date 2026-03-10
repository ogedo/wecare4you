import type { FastifyInstance } from "fastify";
import { requireRole } from "../../plugins/auth";
import { BuddyController } from "./buddy.controller";

export async function buddyRoutes(app: FastifyInstance) {
  const ctrl = new BuddyController();

  app.get("/", (req, reply) => ctrl.list(req, reply));
  app.get("/:id", (req, reply) => ctrl.getById(req, reply));
  app.get("/:id/availability", (req, reply) => ctrl.getAvailability(req, reply));
  app.get("/:id/slots", (req, reply) => ctrl.getSlots(req, reply));

  app.get("/me/profile", { preHandler: requireRole("TALK_BUDDY") }, (req, reply) =>
    ctrl.getMyProfile(req, reply)
  );
  app.patch("/me/profile", { preHandler: requireRole("TALK_BUDDY") }, (req, reply) =>
    ctrl.updateProfile(req, reply)
  );
  app.put("/me/availability", { preHandler: requireRole("TALK_BUDDY") }, (req, reply) =>
    ctrl.updateAvailability(req, reply)
  );
}
