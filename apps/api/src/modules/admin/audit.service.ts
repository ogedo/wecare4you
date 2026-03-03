import { prisma } from "../../lib/prisma";

export async function logAudit(params: {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  await prisma.auditLog.create({ data: params }).catch(() => {
    // Non-blocking: audit failure should not break the request
  });
}
