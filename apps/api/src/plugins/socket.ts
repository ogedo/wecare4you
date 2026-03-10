import type { FastifyInstance } from "fastify";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";
import { env } from "../lib/env";
import { prisma } from "../lib/prisma";

export async function setupSocketIO(app: FastifyInstance) {
  // Socket.io Redis adapter needs separate pub/sub clients
  const pubClient = new Redis(env.REDIS_URL);
  const subClient = pubClient.duplicate();

  const io = new Server(app.server, {
    cors: {
      origin: [env.FRONTEND_URL, "http://localhost:3000", "http://localhost:8081"],
      credentials: true,
    },
    adapter: createAdapter(pubClient, subClient),
    pingTimeout: 30000,
    pingInterval: 10000,
  });

  // JWT authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) return next(new Error("No auth token provided"));

      const payload = app.jwt.verify<{ sub: string; role: string }>(token);
      socket.data.userId = payload.sub;
      socket.data.role = payload.role;
      next();
    } catch {
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    const userId: string = socket.data.userId;
    const role: string = socket.data.role;
    app.log.debug(`[Socket] Connected: ${userId} (${role})`);

    // Each user joins their personal room for direct notifications
    socket.join(`user:${userId}`);

    // Crisis counselors join the counselors:online room to receive incoming crisis sessions
    if (role === "CRISIS_COUNSELOR") {
      socket.join("counselors:online");
      app.log.debug(`[Socket] Counselor ${userId} joined counselors:online`);
    }

    // Join a conversation channel
    socket.on("join:conversation", (conversationId: string) => {
      socket.join(`conv:${conversationId}`);
    });

    // Leave a conversation channel
    socket.on("leave:conversation", (conversationId: string) => {
      socket.leave(`conv:${conversationId}`);
    });

    // Join a crisis session room (both patient and counselor call this after connecting)
    socket.on("join:crisis", (sessionId: string) => {
      socket.join(`crisis:${sessionId}`);
    });

    // Leave a crisis session room
    socket.on("leave:crisis", (sessionId: string) => {
      socket.leave(`crisis:${sessionId}`);
    });

    // Real-time message send (saves to DB + broadcasts)
    socket.on(
      "message:send",
      async (data: { conversationId: string; content: string }, ack?: (msg: unknown) => void) => {
        try {
          const message = await prisma.message.create({
            data: {
              conversationId: data.conversationId,
              senderId: userId,
              content: data.content.trim(),
            },
          });
          io.to(`conv:${data.conversationId}`).emit("message:new", message);
          ack?.(message);
        } catch {
          socket.emit("error", { message: "Failed to send message" });
        }
      }
    );

    // Mark message as read
    socket.on(
      "message:read",
      async (data: { conversationId: string; messageId: string }) => {
        try {
          await prisma.message.update({
            where: { id: data.messageId },
            data: { readAt: new Date() },
          });
          socket.to(`conv:${data.conversationId}`).emit("message:read", data);
        } catch {
          // Best-effort
        }
      }
    );

    // Typing indicators (ephemeral — no DB)
    socket.on("typing:start", (conversationId: string) => {
      socket.to(`conv:${conversationId}`).emit("typing:start", { userId });
    });

    socket.on("typing:stop", (conversationId: string) => {
      socket.to(`conv:${conversationId}`).emit("typing:stop", { userId });
    });

    // Crisis real-time messages (persisted to CrisisMessage table)
    socket.on(
      "crisis:message:send",
      async (data: { sessionId: string; content: string }, ack?: (msg: unknown) => void) => {
        try {
          // Verify caller is part of this session
          const session = await prisma.crisisSession.findUnique({
            where: { id: data.sessionId },
            include: { counselor: true },
          });

          if (!session) {
            socket.emit("error", { message: "Session not found" });
            return;
          }

          const isCounselor = session.counselor?.userId === userId;
          const isPatient = session.patientId === userId;

          if (!isPatient && !isCounselor) {
            socket.emit("error", { message: "Not authorised" });
            return;
          }

          const message = await prisma.crisisMessage.create({
            data: {
              crisisSessionId: data.sessionId,
              senderId: userId,
              content: data.content.trim(),
            },
          });

          io.to(`crisis:${data.sessionId}`).emit("crisis:message:new", message);
          ack?.(message);
        } catch {
          socket.emit("error", { message: "Failed to send crisis message" });
        }
      }
    );

    socket.on("disconnect", (reason) => {
      app.log.debug(`[Socket] Disconnected: ${userId} (${reason})`);
    });
  });

  // Expose io on app for use in route handlers
  app.decorate("io", io);
  app.log.info("Socket.io initialised with Redis adapter");
}
