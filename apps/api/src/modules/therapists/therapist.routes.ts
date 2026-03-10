import type { FastifyInstance } from "fastify";
import { authenticate, requireRole } from "../../plugins/auth";
import { TherapistController } from "./therapist.controller";

export async function therapistRoutes(app: FastifyInstance) {
  const ctrl = new TherapistController();

  // Public
  app.get("/", (req, reply) => ctrl.list(req, reply));
  app.get("/:id", (req, reply) => ctrl.getById(req, reply));
  app.get("/:id/availability", (req, reply) => ctrl.getAvailability(req, reply));
  app.get("/:id/slots", (req, reply) => ctrl.getSlots(req, reply));

  // Therapist only
  app.patch("/me/profile", { preHandler: requireRole("THERAPIST") }, (req, reply) =>
    ctrl.updateProfile(req, reply)
  );
  app.put("/me/availability", { preHandler: requireRole("THERAPIST") }, (req, reply) =>
    ctrl.updateAvailability(req, reply)
  );
}
