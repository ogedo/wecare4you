/**
 * Seed: creates test accounts for all roles.
 *
 * Usage: pnpm --filter @wecare4you/api db:seed
 *
 * Accounts created:
 *   Admin      admin@wecare4you.ng        / WeCare4You@2024!
 *   Therapist  therapist@wecare4you.ng    / WeCare4You@2024!
 *   Talk Buddy buddy@wecare4you.ng        / WeCare4You@2024!
 *   Patient    patient@wecare4you.ng      / WeCare4You@2024!
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const PASSWORD = "WeCare4You@2024!";

const weeklySchedule = {
  monday:    [{ start: "09:00", end: "17:00" }],
  tuesday:   [{ start: "09:00", end: "17:00" }],
  wednesday: [{ start: "09:00", end: "17:00" }],
  thursday:  [{ start: "09:00", end: "17:00" }],
  friday:    [{ start: "09:00", end: "13:00" }],
  saturday:  [],
  sunday:    [],
};

async function upsertUser(data: {
  phone: string;
  email: string;
  role: "ADMIN" | "THERAPIST" | "TALK_BUDDY" | "PATIENT" | "CRISIS_COUNSELOR";
}) {
  const existing = await prisma.user.findUnique({ where: { phone: data.phone } });
  if (existing) {
    console.log(`  ↩  ${data.role} already exists (${data.email})`);
    return existing;
  }
  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  const user = await prisma.user.create({
    data: { ...data, passwordHash, isVerified: true },
  });
  console.log(`  ✓  ${data.role} created: ${user.email}`);
  return user;
}

async function main() {
  console.log("\n── Seeding WeCare4You test accounts ──\n");

  // ── Admin ────────────────────────────────────────────────────────────────
  await upsertUser({
    phone: "+2348000000001",
    email: "admin@wecare4you.ng",
    role: "ADMIN",
  });

  // ── Therapist ─────────────────────────────────────────────────────────────
  const therapist = await upsertUser({
    phone: "+2348000000002",
    email: "therapist@wecare4you.ng",
    role: "THERAPIST",
  });

  const existingTherapistProfile = await prisma.therapistProfile.findUnique({
    where: { userId: therapist.id },
  });
  if (!existingTherapistProfile) {
    await prisma.therapistProfile.create({
      data: {
        userId: therapist.id,
        licenseNumber: "MDCN/2020/12345",
        licenseBody: "MDCN",
        specializations: ["Anxiety", "Depression", "Trauma", "Stress Management"],
        bio: "Dr. Amaka Obi is a licensed clinical psychologist with 8 years of experience helping individuals navigate anxiety, depression, and life transitions. She uses a client-centred, evidence-based approach.",
        sessionRate: 2000000, // ₦20,000 in kobo
        isApproved: true,
        state: "Lagos",
        availability: weeklySchedule,
      },
    });
    console.log("  ✓  TherapistProfile created");
  }

  // ── Talk Buddy ────────────────────────────────────────────────────────────
  const buddy = await upsertUser({
    phone: "+2348000000003",
    email: "buddy@wecare4you.ng",
    role: "TALK_BUDDY",
  });

  const existingBuddyProfile = await prisma.buddyProfile.findUnique({
    where: { userId: buddy.id },
  });
  if (!existingBuddyProfile) {
    await prisma.buddyProfile.create({
      data: {
        userId: buddy.id,
        bio: "Hi, I'm Chidi — a trained peer listener and mental health advocate. I'm here to offer a safe, judgement-free space to talk through whatever is on your mind.",
        sessionRate: 500000, // ₦5,000 in kobo
        isApproved: true,
        availability: weeklySchedule,
      },
    });
    console.log("  ✓  BuddyProfile created");
  }

  // ── Patient ───────────────────────────────────────────────────────────────
  const patient = await upsertUser({
    phone: "+2348000000004",
    email: "patient@wecare4you.ng",
    role: "PATIENT",
  });

  const existingPatientProfile = await prisma.patientProfile.findUnique({
    where: { userId: patient.id },
  });
  if (!existingPatientProfile) {
    await prisma.patientProfile.create({
      data: {
        userId: patient.id,
        dateOfBirth: new Date("1995-06-15"),
        state: "Abuja",
        emergencyContact: "+2348011111111",
      },
    });
    console.log("  ✓  PatientProfile created");
  }

  // ── Crisis Counselor ─────────────────────────────────────────────────────
  const counselor = await upsertUser({
    phone: "+2348000000005",
    email: "counselor@wecare4you.ng",
    role: "CRISIS_COUNSELOR",
  });

  const existingCounselorProfile = await prisma.crisisCounselorProfile.findUnique({
    where: { userId: counselor.id },
  });
  if (!existingCounselorProfile) {
    await prisma.crisisCounselorProfile.create({
      data: {
        userId: counselor.id,
        bio: "Trained crisis counselor and mental health first responder with 5 years of experience in acute psychological support.",
        isApproved: true,
      },
    });
    console.log("  ✓  CrisisCounselorProfile created");
  }

  // ── Session Packages ─────────────────────────────────────────────────────
  const therapistUser = await prisma.user.findUnique({ where: { email: "therapist@wecare4you.ng" } });
  const buddyUser = await prisma.user.findUnique({ where: { email: "buddy@wecare4you.ng" } });

  if (therapistUser) {
    const existingPkgs = await prisma.sessionPackage.count({ where: { providerId: therapistUser.id } });
    if (existingPkgs === 0) {
      await prisma.sessionPackage.createMany({
        data: [
          { providerId: therapistUser.id, providerType: "THERAPIST", name: "Starter Pack", sessions: 3, priceKobo: 4800000 },
          { providerId: therapistUser.id, providerType: "THERAPIST", name: "Monthly Bundle", sessions: 6, priceKobo: 8400000 },
        ],
      });
      console.log("  ✓  Therapist session packages created");
    }
  }

  if (buddyUser) {
    const existingPkgs = await prisma.sessionPackage.count({ where: { providerId: buddyUser.id } });
    if (existingPkgs === 0) {
      await prisma.sessionPackage.createMany({
        data: [
          { providerId: buddyUser.id, providerType: "TALK_BUDDY", name: "Intro Pack", sessions: 4, priceKobo: 1600000 },
          { providerId: buddyUser.id, providerType: "TALK_BUDDY", name: "Support Bundle", sessions: 8, priceKobo: 2800000 },
        ],
      });
      console.log("  ✓  Buddy session packages created");
    }
  }

  console.log(`
── All accounts use password: ${PASSWORD} ──

  Role             Email                          Phone
  ──────────────── ─────────────────────────────  ────────────────
  Admin            admin@wecare4you.ng            +2348000000001
  Therapist        therapist@wecare4you.ng        +2348000000002
  Talk Buddy       buddy@wecare4you.ng            +2348000000003
  Patient          patient@wecare4you.ng          +2348000000004
  Crisis Counselor counselor@wecare4you.ng        +2348000000005
`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
