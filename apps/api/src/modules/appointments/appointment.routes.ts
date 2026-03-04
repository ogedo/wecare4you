import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { authenticate } from "../../plugins/auth";
import { AppointmentController } from "./appointment.controller";
import { prisma } from "../../lib/prisma";

async function checkAppointmentParticipant(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const appt = await prisma.appointment.findUnique({
    where: { id },
    include: { patient: true, therapist: true, buddy: true },
  });
  if (!appt) return reply.code(404).send({ success: false, error: "Appointment not found" });

  const userId = req.user.sub;
  const isParticipant =
    appt.patient.userId === userId ||
    appt.therapist?.userId === userId ||
    appt.buddy?.userId === userId ||
    req.user.role === "ADMIN";

  if (!isParticipant) return reply.code(403).send({ success: false, error: "Forbidden" });
}

export async function appointmentRoutes(app: FastifyInstance) {
  const ctrl = new AppointmentController();

  app.post("/", { preHandler: authenticate }, (req, reply) => ctrl.create(req, reply));
  app.get("/", { preHandler: authenticate }, (req, reply) => ctrl.list(req, reply));
  app.get("/:id", { preHandler: authenticate }, (req, reply) => ctrl.getById(req, reply));
  app.patch("/:id/status", { preHandler: [authenticate, checkAppointmentParticipant] }, (req, reply) =>
    ctrl.updateStatus(req, reply)
  );
  app.delete("/:id", { preHandler: [authenticate, checkAppointmentParticipant] }, (req, reply) =>
    ctrl.cancel(req, reply)
  );
}
