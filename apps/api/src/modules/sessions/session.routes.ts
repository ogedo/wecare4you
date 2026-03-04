import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { authenticate } from "../../plugins/auth";
import { SessionController } from "./session.controller";
import { prisma } from "../../lib/prisma";

async function checkSessionParticipant(req: FastifyRequest, reply: FastifyReply) {
  const { appointmentId, id } = req.params as { appointmentId?: string; id?: string };

  let apptId = appointmentId;
  if (!apptId && id) {
    const session = await prisma.session.findUnique({ where: { id } });
    if (!session) return reply.code(404).send({ success: false, error: "Session not found" });
    apptId = session.appointmentId;
  }

  if (!apptId) return reply.code(400).send({ success: false, error: "Missing appointment ID" });

  const appt = await prisma.appointment.findUnique({
    where: { id: apptId },
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

export async function sessionRoutes(app: FastifyInstance) {
  const ctrl = new SessionController();

  app.post("/:appointmentId/start", { preHandler: [authenticate, checkSessionParticipant] }, (req, reply) =>
    ctrl.start(req, reply)
  );
  app.get("/:appointmentId/token", { preHandler: [authenticate, checkSessionParticipant] }, (req, reply) =>
    ctrl.getToken(req, reply)
  );
  app.patch("/:id/end", { preHandler: [authenticate, checkSessionParticipant] }, (req, reply) =>
    ctrl.end(req, reply)
  );
}
