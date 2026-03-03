import { z } from "zod";
import type { Role } from "./enums";

// ─── Zod schemas ─────────────────────────────────────────────────────────────

export const SendOtpSchema = z.object({
  phone: z
    .string()
    .regex(/^\+234[0-9]{10}$/, "Phone must be in Nigerian format: +2348012345678"),
});

export const VerifyOtpSchema = z.object({
  phone: z.string(),
  code: z.string().length(6, "OTP must be 6 digits"),
});

export const RegisterSchema = z.object({
  phone: z.string(),
  otpToken: z.string(),     // short-lived token issued after OTP verify
  role: z.enum(["PATIENT", "THERAPIST", "TALK_BUDDY"]),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const UpdateUserSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
});

export const TherapistProfileSchema = z.object({
  licenseNumber: z.string().min(1),
  licenseBody: z.string().min(1),
  specializations: z.array(z.string()).min(1),
  bio: z.string().min(20).max(1000),
  sessionRate: z.number().int().positive(),   // kobo
  state: z.string().optional(),
  availability: z.record(z.string(), z.any()),
});

export const BuddyProfileSchema = z.object({
  bio: z.string().min(20).max(1000),
  sessionRate: z.number().int().positive(),   // kobo
  availability: z.record(z.string(), z.any()),
});

export const PatientProfileSchema = z.object({
  dateOfBirth: z.string().optional(),
  state: z.string().optional(),
  emergencyContact: z.string().optional(),
});

// ─── TypeScript interfaces ────────────────────────────────────────────────────

export interface PublicUser {
  id: string;
  phone: string;
  email?: string | null;
  role: Role;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface TherapistPublic {
  id: string;
  userId: string;
  licenseNumber: string;
  licenseBody: string;
  specializations: string[];
  bio: string;
  sessionRate: number;
  isApproved: boolean;
  state?: string | null;
  user: Pick<PublicUser, "id" | "phone" | "email">;
}

export interface BuddyPublic {
  id: string;
  userId: string;
  bio: string;
  sessionRate: number;
  isApproved: boolean;
  user: Pick<PublicUser, "id" | "phone" | "email">;
}
