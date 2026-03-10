import type { Server } from "socket.io";
import { prisma } from "../../lib/prisma";
import { sendEmail } from "../../lib/email";

interface NotifyOptions {
  userId: string;
  userEmail?: string;
  type: string;
  payload?: Record<string, unknown>;
  emailSubject?: string;
  emailHtml?: string;
}

export class NotificationService {
  static async notify(io: Server, opts: NotifyOptions) {
    const { userId, userEmail, type, payload, emailSubject, emailHtml } = opts;

    const notif = await prisma.notification.create({
      data: { userId, type, payload: (payload ?? {}) as never },
    });

    io.to(`user:${userId}`).emit("notification:new", notif);

    if (emailSubject && userEmail && emailHtml) {
      await sendEmail({ to: userEmail, subject: emailSubject, html: emailHtml }).catch(() => {});
    }

    return notif;
  }
}
