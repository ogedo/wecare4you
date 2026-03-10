import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { AuthService } from "./auth.service";
import { SendOtpSchema, VerifyOtpSchema, RegisterSchema, LoginSchema } from "@wecare4you/types";
import { env } from "../../lib/env";
import { sendEmail } from "../../lib/email";

const COOKIE_OPTS = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  maxAge: 7 * 24 * 3600,
};

const SESSION_SIGNAL_OPTS = {
  httpOnly: false,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 7 * 24 * 3600,
};

export class AuthController {
  private service = new AuthService();
  private app: FastifyInstance;

  constructor(app: FastifyInstance) {
    this.app = app;
  }

  async sendOtp(req: FastifyRequest, reply: FastifyReply) {
    const body = SendOtpSchema.safeParse(req.body);
    if (!body.success) {
      return reply.code(400).send({ success: false, error: body.error.flatten().fieldErrors });
    }
    try {
      await this.service.sendOtp(body.data.phone);
      return reply.send({ success: true, message: "OTP sent successfully" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send OTP";
      return reply.code(429).send({ success: false, error: msg });
    }
  }

  async verifyOtp(req: FastifyRequest, reply: FastifyReply) {
    const body = VerifyOtpSchema.safeParse(req.body);
    if (!body.success) {
      return reply.code(400).send({ success: false, error: body.error.flatten().fieldErrors });
    }
    try {
      const otpToken = await this.service.verifyOtp(body.data.phone, body.data.code);
      return reply.send({ success: true, data: { otpToken } });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "OTP verification failed";
      return reply.code(400).send({ success: false, error: msg });
    }
  }

  async register(req: FastifyRequest, reply: FastifyReply) {
    const body = RegisterSchema.safeParse(req.body);
    if (!body.success) {
      return reply.code(400).send({ success: false, error: body.error.flatten().fieldErrors });
    }
    try {
      const user = await this.service.register(body.data as { phone: string; otpToken: string; role: string; email?: string; password?: string });
      const { accessToken, refreshToken } = this.issueTokens(user.id, user.role);
      await this.service.storeRefreshToken(user.id, refreshToken);
      reply.setCookie("refreshToken", refreshToken, COOKIE_OPTS);
      reply.setCookie("wc4y_session", "1", SESSION_SIGNAL_OPTS);

      // N10: Notify admin of new provider registration
      if (user.role === "THERAPIST" || user.role === "TALK_BUDDY" || user.role === "CRISIS_COUNSELOR") {
        const roleLabel = user.role === "THERAPIST" ? "Therapist" : user.role === "TALK_BUDDY" ? "Talk Buddy" : "Crisis Counselor";
        await sendEmail({
          to: env.ADMIN_EMAIL,
          subject: `New ${roleLabel} pending approval: ${user.phone}`,
          html: `<p>A new <strong>${roleLabel}</strong> has registered and is awaiting approval.<br/>Phone: <strong>${user.phone}</strong><br/>Email: ${user.email ?? "N/A"}</p>`,
        }).catch(() => {});
      }

      return reply.code(201).send({
        success: true,
        data: {
          accessToken,
          user: { id: user.id, phone: user.phone, role: user.role },
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed";
      return reply.code(400).send({ success: false, error: msg });
    }
  }

  async login(req: FastifyRequest, reply: FastifyReply) {
    const body = LoginSchema.safeParse(req.body);
    if (!body.success) {
      return reply.code(400).send({ success: false, error: body.error.flatten().fieldErrors });
    }
    try {
      const user = await this.service.login(body.data.email, body.data.password);
      const { accessToken, refreshToken } = this.issueTokens(user.id, user.role);
      await this.service.storeRefreshToken(user.id, refreshToken);
      reply.setCookie("refreshToken", refreshToken, COOKIE_OPTS);
      reply.setCookie("wc4y_session", "1", SESSION_SIGNAL_OPTS);
      return reply.send({
        success: true,
        data: {
          accessToken,
          user: { id: user.id, phone: user.phone, email: user.email, role: user.role },
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed";
      return reply.code(401).send({ success: false, error: msg });
    }
  }

  async refresh(req: FastifyRequest, reply: FastifyReply) {
    const token = req.cookies?.refreshToken;
    if (!token) return reply.code(401).send({ success: false, error: "No refresh token" });
    try {
      const payload = this.app.jwt.verify<{ sub: string; role: string }>(token);
      const valid = await this.service.validateRefreshToken(payload.sub, token);
      if (!valid) return reply.code(401).send({ success: false, error: "Invalid refresh token" });

      const { accessToken, refreshToken: newRefresh } = this.issueTokens(payload.sub, payload.role);
      await this.service.storeRefreshToken(payload.sub, newRefresh);
      reply.setCookie("refreshToken", newRefresh, COOKIE_OPTS);
      return reply.send({ success: true, data: { accessToken } });
    } catch {
      return reply.code(401).send({ success: false, error: "Invalid refresh token" });
    }
  }

  async logout(req: FastifyRequest, reply: FastifyReply) {
    try {
      await req.jwtVerify();
      await this.service.revokeRefreshToken(req.user.sub);
    } catch {
      // Best-effort logout
    }
    reply.clearCookie("refreshToken");
    reply.clearCookie("wc4y_session");
    return reply.send({ success: true, message: "Logged out" });
  }

  private issueTokens(userId: string, role: string) {
    const accessToken = this.app.jwt.sign(
      { sub: userId, role },
      { expiresIn: env.JWT_ACCESS_EXPIRY }
    );
    const refreshToken = this.app.jwt.sign(
      { sub: userId, role },
      { expiresIn: env.JWT_REFRESH_EXPIRY }
    );
    return { accessToken, refreshToken };
  }
}
