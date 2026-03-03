import type { FastifyRequest, FastifyReply } from "fastify";

export async function authenticate(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify();
  } catch {
    return reply.code(401).send({ success: false, error: "Unauthorized" });
  }
}

export function requireRole(...roles: string[]) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      await req.jwtVerify();
    } catch {
      return reply.code(401).send({ success: false, error: "Unauthorized" });
    }
    if (!roles.includes(req.user.role)) {
      return reply.code(403).send({ success: false, error: "Forbidden" });
    }
  };
}
