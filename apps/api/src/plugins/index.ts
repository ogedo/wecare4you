import type { FastifyInstance } from "fastify";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fp = require("fastify-plugin");
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import cookie from "@fastify/cookie";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
import { env } from "../lib/env";
import { prisma } from "../lib/prisma";
import { redis } from "../lib/redis";

// Augment FastifyRequest with user payload
declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { sub: string; role: string };
    user: { sub: string; role: string };
  }
}

async function plugins(app: FastifyInstance) {
  // Security headers
  await app.register(helmet, { contentSecurityPolicy: false });

  // CORS
  await app.register(cors, {
    origin: [env.FRONTEND_URL, "http://localhost:3000", "http://localhost:8081"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });

  // Rate limiting (memory store in dev; can add Redis store for production clustering)
  await app.register(rateLimit, {
    max: 200,
    timeWindow: "1 minute",
    keyGenerator: (req) => req.ip,
    errorResponseBuilder: () => ({
      success: false,
      error: "Too many requests. Please slow down.",
    }),
  });

  // Cookie parsing (for refresh token httpOnly cookie)
  await app.register(cookie);

  // JWT (access token via Authorization header)
  await app.register(jwt, {
    secret: env.JWT_SECRET,
  });

  // Make Prisma + Redis available on app instance
  app.decorate("prisma", prisma);
  app.decorate("redis", redis);

  // Lifecycle hooks
  app.addHook("onReady", async () => {
    await prisma.$connect();
    app.log.info("PostgreSQL connected via Prisma");
  });

  app.addHook("onClose", async () => {
    await prisma.$disconnect();
    await redis.quit().catch(() => {});
  });
}

export const registerPlugins = fp(plugins);
