import type { FastifyInstance } from "fastify";
import { authenticate } from "../../plugins/auth";
import { AppointmentController } from "./appointment.controller";

export async function appointmentRoutes(app: FastifyInstance) {
  const ctrl = new AppointmentController();

  app.post("/", { preHandler: authenticate }, (req, reply) => ctrl.create(req, reply));
  app.get("/", { preHandler: authenticate }, (req, reply) => ctrl.list(req, reply));
  app.get("/:id", { preHandler: authenticate }, (req, reply) => ctrl.getById(req, reply));
  app.patch("/:id/status", { preHandler: authenticate }, (req, reply) =>
    ctrl.updateStatus(req, reply)
  );
  app.delete("/:id", { preHandler: authenticate }, (req, reply) => ctrl.cancel(req, reply));
}
