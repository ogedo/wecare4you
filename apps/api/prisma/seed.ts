/**
 * Seed: creates the initial admin user.
 *
 * Usage: pnpm --filter @wecare4you/api tsx prisma/seed.ts
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPhone = process.env.ADMIN_PHONE ?? "+2348000000001";
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@wecare4you.ng";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "WeCare4You@2024!";

  const existing = await prisma.user.findUnique({ where: { phone: adminPhone } });
  if (existing) {
    console.log("Admin already exists:", existing.id);
    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.create({
    data: {
      phone: adminPhone,
      email: adminEmail,
      passwordHash,
      role: "ADMIN",
      isVerified: true,
    },
  });

  console.log("Admin created:", admin.id, admin.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
