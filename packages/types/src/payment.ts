import { z } from "zod";
import type { PaymentStatus } from "./enums";

export const InitializePaymentSchema = z.object({
  appointmentId: z.string(),
});

export const OnboardBankSchema = z.object({
  accountNumber: z.string().length(10),
  bankCode: z.string(),
});

export interface PaymentResponse {
  id: string;
  appointmentId: string;
  paystackReference: string;
  amount: number;           // kobo
  platformFee: number;      // kobo
  currency: string;
  status: PaymentStatus;
  paidAt?: string | null;
  payoutSentAt?: string | null;
}

export interface PaystackInitResponse {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

export interface BankAccount {
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}
