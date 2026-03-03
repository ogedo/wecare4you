import { z } from "zod";
import type { AppointmentStatus, AppointmentType } from "./enums";

export const CreateAppointmentSchema = z.object({
  therapistId: z.string().optional(),
  buddyId: z.string().optional(),
  scheduledAt: z.string().datetime(),
  duration: z.number().int().min(30).max(120),
  type: z.enum(["VIDEO", "AUDIO"]).default("VIDEO"),
}).refine(
  (d) => d.therapistId || d.buddyId,
  { message: "Must specify either therapistId or buddyId" }
);

export const UpdateAppointmentStatusSchema = z.object({
  status: z.enum(["CONFIRMED", "CANCELLED", "COMPLETED"]),
});

export interface AppointmentResponse {
  id: string;
  patientId: string;
  therapistId?: string | null;
  buddyId?: string | null;
  scheduledAt: string;
  duration: number;
  status: AppointmentStatus;
  type: AppointmentType;
  payment?: {
    paystackReference: string;
    amount: number;
    status: string;
  } | null;
  createdAt: string;
}
