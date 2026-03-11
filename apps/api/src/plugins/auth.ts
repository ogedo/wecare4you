import type { FastifyRequest, FastifyReply } from "fastify";

export async function authenticate(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify();
  } catch {
    return reply.code(401).send({ success: false, error: "Unauthorized" });
  }
}

// requireRole("ADMIN") — any admin
// requireRole("ADMIN", "SUPER") — admin with SUPER tier only
export function requireRole(role: string, tier?: string) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      await req.jwtVerify();
    } catch {
      return reply.code(401).send({ success: false, error: "Unauthorized" });
    }
    if (req.user.role !== role) {
      return reply.code(403).send({ success: false, error: "Forbidden" });
    }
    if (tier && req.user.adminTier !== tier) {
      return reply.code(403).send({ success: false, error: "Super admin access required" });
    }
  };
}
