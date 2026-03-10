import type { FastifyInstance } from "fastify";
import { authenticate, requireRole } from "../../plugins/auth";
import { PackageController } from "./package.controller";

export async function packageRoutes(app: FastifyInstance) {
  const ctrl = new PackageController();

  // Public
  app.get("/", (req, reply) => ctrl.list(req, reply));

  // Provider
  app.post("/", { preHandler: authenticate }, (req, reply) => ctrl.create(req, reply));
  app.delete("/:id", { preHandler: authenticate }, (req, reply) => ctrl.deactivate(req, reply));

  // Patient
  app.post("/:id/purchase", { preHandler: requireRole("PATIENT") }, (req, reply) =>
    ctrl.purchase(req, reply)
  );
  app.get("/verify", { preHandler: requireRole("PATIENT") }, (req, reply) =>
    ctrl.verify(req, reply)
  );
  app.get("/mine", { preHandler: requireRole("PATIENT") }, (req, reply) =>
    ctrl.mine(req, reply)
  );
}
