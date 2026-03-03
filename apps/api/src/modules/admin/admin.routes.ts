import type { FastifyInstance } from "fastify";
import { requireRole } from "../../plugins/auth";
import { AdminController } from "./admin.controller";

export async function adminRoutes(app: FastifyInstance) {
  const ctrl = new AdminController();
  const adminOnly = { preHandler: requireRole("ADMIN") };

  app.get("/stats", adminOnly, (req, reply) => ctrl.getStats(req, reply));
  app.get("/users", adminOnly, (req, reply) => ctrl.listUsers(req, reply));
  app.patch("/therapists/:id/approve", adminOnly, (req, reply) =>
    ctrl.approveTherapist(req, reply)
  );
  app.patch("/buddies/:id/approve", adminOnly, (req, reply) => ctrl.approveBuddy(req, reply));
  app.get("/revenue", adminOnly, (req, reply) => ctrl.getRevenue(req, reply));
  app.get("/payouts", adminOnly, (req, reply) => ctrl.getPayouts(req, reply));
}
