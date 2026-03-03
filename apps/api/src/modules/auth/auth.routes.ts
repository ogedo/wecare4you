import type { FastifyInstance } from "fastify";
import { AuthController } from "./auth.controller";

export async function authRoutes(app: FastifyInstance) {
  const ctrl = new AuthController(app);

  // Phone OTP flow
  app.post("/send-otp", (req, reply) => ctrl.sendOtp(req, reply));
  app.post("/verify-otp", (req, reply) => ctrl.verifyOtp(req, reply));
  app.post("/register", (req, reply) => ctrl.register(req, reply));

  // Email/password fallback
  app.post("/login", (req, reply) => ctrl.login(req, reply));

  // Token management
  app.post("/refresh", (req, reply) => ctrl.refresh(req, reply));
  app.post("/logout", (req, reply) => ctrl.logout(req, reply));
}
