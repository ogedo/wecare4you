import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import { redis } from "../../lib/redis";
import { sendOtp, generateOtpCode } from "../../lib/termii";
import { env } from "../../lib/env";

const OTP_EXPIRY_SECONDS = 600; // 10 minutes
const OTP_TOKEN_EXPIRY_SECONDS = 300; // 5 minutes (after verify → register window)

export class AuthService {
  async sendOtp(phone: string): Promise<void> {
    // Rate-limit: max 3 OTP requests per phone per 10 minutes
    const key = `otp_rate:${phone}`;
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, 600);
    if (count > 3) throw new Error("Too many OTP requests. Please wait before trying again.");

    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_SECONDS * 1000);

    // Store in DB for audit + use-once enforcement
    await prisma.otpCode.create({ data: { phone, code, expiresAt } });

    // Also store in Redis for fast lookup
    await redis.setex(`otp:${phone}`, OTP_EXPIRY_SECONDS, code);

    // Send via Termii
    if (env.NODE_ENV !== "test") {
      await sendOtp(phone, code);
    }
  }

  async verifyOtp(phone: string, code: string): Promise<string> {
    const stored = await redis.get(`otp:${phone}`);
    if (!stored || stored !== code) {
      // Fallback: check DB
      const dbOtp = await prisma.otpCode.findFirst({
        where: { phone, code, used: false, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: "desc" },
      });
      if (!dbOtp) throw new Error("Invalid or expired OTP");
      await prisma.otpCode.update({ where: { id: dbOtp.id }, data: { used: true } });
    } else {
      await redis.del(`otp:${phone}`);
      await prisma.otpCode.updateMany({
        where: { phone, code, used: false },
        data: { used: true },
      });
    }

    // Issue short-lived token confirming phone ownership
    const token = `otpv_${phone}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    await redis.setex(`otptoken:${token}`, OTP_TOKEN_EXPIRY_SECONDS, phone);
    return token;
  }

  async register(params: {
    phone: string;
    otpToken: string;
    role: string;
    email?: string;
    password?: string;
  }) {
    const storedPhone = await redis.get(`otptoken:${params.otpToken}`);
    if (!storedPhone || storedPhone !== params.phone) {
      throw new Error("Invalid or expired verification token. Please re-verify your phone.");
    }
    await redis.del(`otptoken:${params.otpToken}`);

    const existing = await prisma.user.findUnique({ where: { phone: params.phone } });
    if (existing) throw new Error("Phone number already registered");

    const passwordHash = params.password ? await bcrypt.hash(params.password, 12) : undefined;

    const user = await prisma.user.create({
      data: {
        phone: params.phone,
        email: params.email,
        passwordHash,
        role: params.role as import("@prisma/client").Role,
        isVerified: true,
        // Create role-specific profile
        ...(params.role === "PATIENT" && {
          patientProfile: { create: {} },
        }),
        ...(params.role === "THERAPIST" && {
          therapistProfile: {
            create: {
              licenseNumber: "",
              licenseBody: "",
              specializations: [],
              bio: "",
              sessionRate: 0,
              availability: {},
            },
          },
        }),
        ...(params.role === "TALK_BUDDY" && {
          buddyProfile: {
            create: { bio: "", sessionRate: 0, availability: {} },
          },
        }),
        ...(params.role === "CRISIS_COUNSELOR" && {
          crisisCounselorProfile: {
            create: { bio: "" },
          },
        }),
      },
    });

    return user;
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) throw new Error("Invalid credentials");

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new Error("Invalid credentials");

    if (!user.isActive) throw new Error("Account is suspended");

    return user;
  }

  async storeRefreshToken(userId: string, token: string): Promise<void> {
    const expiry = 7 * 24 * 3600; // 7 days
    await redis.setex(`refresh:${userId}`, expiry, token);
  }

  async validateRefreshToken(userId: string, token: string): Promise<boolean> {
    const stored = await redis.get(`refresh:${userId}`);
    return stored === token;
  }

  async revokeRefreshToken(userId: string): Promise<void> {
    await redis.del(`refresh:${userId}`);
  }
}
