import type { FastifyInstance } from "fastify";
import { requireRole } from "../../plugins/auth";
import { PatientController } from "./patient.controller";

export async function patientRoutes(app: FastifyInstance) {
  const ctrl = new PatientController();
  app.get("/me/profile", { preHandler: requireRole("PATIENT") }, (req, reply) =>
    ctrl.getProfile(req, reply)
  );
  app.patch("/me/profile", { preHandler: requireRole("PATIENT") }, (req, reply) =>
    ctrl.updateProfile(req, reply)
  );
}
