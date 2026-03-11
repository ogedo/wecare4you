import type { FastifyInstance } from "fastify";
import { requireRole } from "../../plugins/auth";
import { AdminController } from "./admin.controller";

export async function adminRoutes(app: FastifyInstance) {
  const ctrl = new AdminController();
  const adminOnly = { preHandler: requireRole("ADMIN") };
  const superOnly = { preHandler: requireRole("ADMIN", "SUPER") };

  app.get("/stats", adminOnly, (req, reply) => ctrl.getStats(req, reply));
  app.get("/users", adminOnly, (req, reply) => ctrl.listUsers(req, reply));

  app.get("/therapists", adminOnly, (req, reply) => ctrl.listTherapists(req, reply));
  app.get("/therapists/:id", adminOnly, (req, reply) => ctrl.getTherapist(req, reply));
  app.patch("/therapists/:id/approve", adminOnly, (req, reply) => ctrl.approveTherapist(req, reply));

  app.get("/buddies", adminOnly, (req, reply) => ctrl.listBuddies(req, reply));
  app.get("/buddies/:id", adminOnly, (req, reply) => ctrl.getBuddy(req, reply));
  app.patch("/buddies/:id/approve", adminOnly, (req, reply) => ctrl.approveBuddy(req, reply));

  app.get("/crisis-counselors", adminOnly, (req, reply) => ctrl.listCrisisCounselors(req, reply));
  app.get("/crisis-counselors/:id", adminOnly, (req, reply) => ctrl.getCrisisCounselor(req, reply));
  app.patch("/crisis-counselors/:id/approve", adminOnly, (req, reply) => ctrl.approveCrisisCounselor(req, reply));
  app.get("/revenue", adminOnly, (req, reply) => ctrl.getRevenue(req, reply));
  app.get("/payouts", adminOnly, (req, reply) => ctrl.getPayouts(req, reply));
  app.get("/analytics", adminOnly, (req, reply) => ctrl.getAnalytics(req, reply));

  app.patch("/users/:id/suspend", adminOnly, (req, reply) => ctrl.suspendUser(req, reply));
  app.patch("/users/:id/reactivate", adminOnly, (req, reply) => ctrl.reactivateUser(req, reply));

  app.get("/admins", superOnly, (req, reply) => ctrl.listAdmins(req, reply));
  app.post("/admins", superOnly, (req, reply) => ctrl.createAdmin(req, reply));
  app.patch("/admins/:id/tier", superOnly, (req, reply) => ctrl.setAdminTier(req, reply));
}
