import type { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../lib/prisma";
import { PatientProfileSchema } from "@wecare4you/types";

export class PatientController {
  async getProfile(req: FastifyRequest, reply: FastifyReply) {
    const profile = await prisma.patientProfile.findUnique({
      where: { userId: req.user.sub },
    });
    if (!profile) return reply.code(404).send({ success: false, error: "Profile not found" });
    return reply.send({ success: true, data: profile });
  }

  async updateProfile(req: FastifyRequest, reply: FastifyReply) {
    const body = PatientProfileSchema.safeParse(req.body);
    if (!body.success) {
      return reply.code(400).send({ success: false, error: body.error.flatten().fieldErrors });
    }
    const profile = await prisma.patientProfile.update({
      where: { userId: req.user.sub },
      data: {
        ...body.data,
        dateOfBirth: body.data.dateOfBirth ? new Date(body.data.dateOfBirth) : undefined,
      },
    });
    return reply.send({ success: true, data: profile });
  }
}
