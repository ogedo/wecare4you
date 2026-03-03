import axios from "axios";
import { env } from "./env";

const isDev = env.NODE_ENV === "development";

const paystack = axios.create({
  baseURL: "https://api.paystack.co",
  headers: {
    Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  },
});

export interface PaystackInitData {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

export async function initializeTransaction(params: {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}): Promise<PaystackInitData> {
  if (isDev) {
    console.log(`[DEV] Mock Paystack init — ref: ${params.reference}, amount: ₦${params.amountKobo / 100}`);
    // Redirect straight to callback so the payment flow completes end-to-end
    return {
      authorizationUrl: `${params.callbackUrl}?reference=${params.reference}`,
      accessCode: `dev_access_${params.reference}`,
      reference: params.reference,
    };
  }

  const { data } = await paystack.post("/transaction/initialize", {
    email: params.email,
    amount: params.amountKobo,
    reference: params.reference,
    callback_url: params.callbackUrl,
    metadata: params.metadata,
  });
  return {
    authorizationUrl: data.data.authorization_url,
    accessCode: data.data.access_code,
    reference: data.data.reference,
  };
}

export async function verifyTransaction(reference: string): Promise<{
  status: string;
  amount: number;
  paid: boolean;
}> {
  if (isDev) {
    console.log(`[DEV] Mock Paystack verify — ref: ${reference} → success`);
    return { status: "success", amount: 0, paid: true };
  }

  const { data } = await paystack.get(`/transaction/verify/${reference}`);
  return {
    status: data.data.status,
    amount: data.data.amount,
    paid: data.data.status === "success",
  };
}

export async function createTransferRecipient(params: {
  accountNumber: string;
  bankCode: string;
  name: string;
}): Promise<string> {
  if (isDev) {
    console.log(`[DEV] Mock Paystack recipient — ${params.name} (${params.accountNumber})`);
    return `DEV_RCP_${params.accountNumber}`;
  }

  const { data } = await paystack.post("/transferrecipient", {
    type: "nuban",
    name: params.name,
    account_number: params.accountNumber,
    bank_code: params.bankCode,
    currency: "NGN",
  });
  return data.data.recipient_code;
}

export async function initiateTransfer(params: {
  recipientCode: string;
  amountKobo: number;
  reference: string;
  reason: string;
}): Promise<string> {
  if (isDev) {
    console.log(`[DEV] Mock Paystack transfer — ref: ${params.reference}, amount: ₦${params.amountKobo / 100}`);
    return `DEV_TRF_${params.reference}`;
  }

  const { data } = await paystack.post("/transfer", {
    source: "balance",
    amount: params.amountKobo,
    recipient: params.recipientCode,
    reference: params.reference,
    reason: params.reason,
  });
  return data.data.transfer_code;
}

export async function resolveAccountNumber(params: {
  accountNumber: string;
  bankCode: string;
}): Promise<{ accountName: string }> {
  if (isDev) {
    console.log(`[DEV] Mock Paystack resolve — ${params.accountNumber}`);
    return { accountName: "DEV ACCOUNT NAME" };
  }

  const { data } = await paystack.get(
    `/bank/resolve?account_number=${params.accountNumber}&bank_code=${params.bankCode}`
  );
  return { accountName: data.data.account_name };
}

export async function listBanks(): Promise<Array<{ name: string; code: string; slug: string }>> {
  if (isDev) {
    // Common Nigerian banks — no API call needed in dev
    return [
      { name: "Access Bank", code: "044", slug: "access-bank" },
      { name: "First Bank of Nigeria", code: "011", slug: "first-bank-of-nigeria" },
      { name: "Guaranty Trust Bank", code: "058", slug: "guaranty-trust-bank" },
      { name: "United Bank for Africa", code: "033", slug: "united-bank-for-africa" },
      { name: "Zenith Bank", code: "057", slug: "zenith-bank" },
      { name: "Stanbic IBTC Bank", code: "221", slug: "stanbic-ibtc-bank" },
      { name: "Fidelity Bank", code: "070", slug: "fidelity-bank" },
      { name: "Union Bank of Nigeria", code: "032", slug: "union-bank-of-nigeria" },
      { name: "Sterling Bank", code: "232", slug: "sterling-bank" },
      { name: "Opay", code: "999992", slug: "opay" },
      { name: "Kuda Bank", code: "090267", slug: "kuda-bank" },
      { name: "Palmpay", code: "999991", slug: "palmpay" },
    ];
  }

  const { data } = await paystack.get("/bank?country=nigeria&currency=NGN&perPage=100");
  return data.data.map((b: { name: string; code: string; slug: string }) => ({
    name: b.name,
    code: b.code,
    slug: b.slug,
  }));
}

export function generateReference(prefix = "MC"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
