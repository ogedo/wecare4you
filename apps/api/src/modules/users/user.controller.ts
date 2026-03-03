import type { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../lib/prisma";
import { UpdateUserSchema } from "@wecare4you/types";
import bcrypt from "bcryptjs";

export class UserController {
  async getMe(req: FastifyRequest, reply: FastifyReply) {
    const user = await prisma.user.findUnique({
      where: { id: req.user.sub },
      select: {
        id: true,
        phone: true,
        email: true,
        role: true,
        isVerified: true,
        isActive: true,
        bvnVerified: true,
        createdAt: true,
        patientProfile: true,
        therapistProfile: true,
        buddyProfile: true,
      },
    });
    if (!user) return reply.code(404).send({ success: false, error: "User not found" });
    return reply.send({ success: true, data: user });
  }

  async updateMe(req: FastifyRequest, reply: FastifyReply) {
    const body = UpdateUserSchema.safeParse(req.body);
    if (!body.success) {
      return reply.code(400).send({ success: false, error: body.error.flatten().fieldErrors });
    }
    const update: Record<string, unknown> = {};
    if (body.data.email) update.email = body.data.email;
    if (body.data.password) update.passwordHash = await bcrypt.hash(body.data.password, 12);

    const user = await prisma.user.update({
      where: { id: req.user.sub },
      data: update,
      select: { id: true, phone: true, email: true, role: true },
    });
    return reply.send({ success: true, data: user });
  }

  async deleteMe(req: FastifyRequest, reply: FastifyReply) {
    // NDPR data deletion
    await prisma.user.update({
      where: { id: req.user.sub },
      data: {
        isActive: false,
        email: null,
        phone: `DELETED_${req.user.sub}`,
        passwordHash: null,
      },
    });
    return reply.send({ success: true, message: "Account scheduled for deletion" });
  }
}
