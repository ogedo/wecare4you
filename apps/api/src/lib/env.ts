import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRY: z.string().default("15m"),
  JWT_REFRESH_EXPIRY: z.string().default("7d"),
  TERMII_API_KEY: z.string().default(""),
  TERMII_SENDER_ID: z.string().default("WeCare4You"),
  TERMII_BASE_URL: z.string().url().default("https://api.ng.termii.com/api"),
  PAYSTACK_SECRET_KEY: z.string().default(""),
  PAYSTACK_WEBHOOK_SECRET: z.string().default(""),
  DAILY_API_KEY: z.string().default(""),
  DAILY_DOMAIN: z.string().default(""),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().default(3001),
  API_HOST: z.string().default("0.0.0.0"),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
  THERAPIST_COMMISSION_RATE: z.coerce.number().default(0.2),
  BUDDY_COMMISSION_RATE: z.coerce.number().default(0.25),
  MINIMUM_PAYOUT_KOBO: z.coerce.number().default(500000),
});

function loadEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error("Invalid environment variables:", result.error.flatten().fieldErrors);
    process.exit(1);
  }
  return result.data;
}

export const env = loadEnv();
export type Env = typeof env;
