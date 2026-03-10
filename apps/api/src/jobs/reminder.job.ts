import cron from "node-cron";
import type { FastifyInstance } from "fastify";
import type { Server } from "socket.io";
import { prisma } from "../lib/prisma";
import { NotificationService } from "../modules/notifications/notification.service";

export function registerReminderJob(app: FastifyInstance) {
  const io = (app as FastifyInstance & { io: Server }).io;

  cron.schedule("* * * * *", async () => {
    try {
      const now = Date.now();
      const in25 = new Date(now + 25 * 60 * 1000);
      const in35 = new Date(now + 35 * 60 * 1000);

      const upcoming = await prisma.appointment.findMany({
        where: {
          status: "CONFIRMED",
          scheduledAt: { gte: in25, lte: in35 },
        },
        include: {
          patient: { include: { user: true } },
          therapist: { include: { user: true } },
          buddy: { include: { user: true } },
        },
      });

      for (const appt of upcoming) {
        const patientUser = appt.patient.user;
        const providerUser = appt.therapist?.user || appt.buddy?.user;
        const scheduledStr = new Date(appt.scheduledAt).toLocaleString("en-NG");

        // Check if reminder already sent to avoid duplicates
        const existingPatientReminder = await prisma.notification.findFirst({
          where: {
            userId: patientUser.id,
            type: "REMINDER_PATIENT",
            payload: { path: ["appointmentId"], equals: appt.id },
          },
        });

        if (!existingPatientReminder) {
          await NotificationService.notify(io, {
            userId: patientUser.id,
            userEmail: patientUser.email ?? undefined,
            type: "REMINDER_PATIENT",
            payload: { appointmentId: appt.id },
            emailSubject: "Your session starts in 30 minutes",
            emailHtml: `<p>Your session starts in 30 minutes (${scheduledStr}). Open the app to join.</p>`,
          });
        }

        if (providerUser) {
          const existingProviderReminder = await prisma.notification.findFirst({
            where: {
              userId: providerUser.id,
              type: "REMINDER_PROVIDER",
              payload: { path: ["appointmentId"], equals: appt.id },
            },
          });

          if (!existingProviderReminder) {
            await NotificationService.notify(io, {
              userId: providerUser.id,
              userEmail: providerUser.email ?? undefined,
              type: "REMINDER_PROVIDER",
              payload: { appointmentId: appt.id },
              emailSubject: "Your session starts in 30 minutes",
              emailHtml: `<p>Your session with ${patientUser.phone} starts in 30 minutes (${scheduledStr}).</p>`,
            });
          }
        }
      }
    } catch (err) {
      app.log.error({ err }, "[ReminderJob] Error");
    }
  });

  app.log.info("Reminder cron job registered (every minute)");
}
