import axios from "axios";
import { env } from "./env";

const isDev = env.NODE_ENV === "development";

const termii = axios.create({
  baseURL: env.TERMII_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

export async function sendOtp(phone: string, code: string): Promise<void> {
  if (isDev) {
    console.log(`\n[DEV] OTP for ${phone}: ${code}\n`);
    return;
  }

  const message = `Your WeCare4You verification code is: ${code}. Valid for 10 minutes. Do not share with anyone.`;
  await termii.post("/sms/send", {
    to: phone,
    from: env.TERMII_SENDER_ID,
    sms: message,
    type: "plain",
    api_key: env.TERMII_API_KEY,
    channel: "dnd",
  });
}

export function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
