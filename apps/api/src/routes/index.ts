import type { FastifyInstance } from "fastify";
import { authRoutes } from "../modules/auth/auth.routes";
import { userRoutes } from "../modules/users/user.routes";
import { therapistRoutes } from "../modules/therapists/therapist.routes";
import { buddyRoutes } from "../modules/buddies/buddy.routes";
import { patientRoutes } from "../modules/patients/patient.routes";
import { appointmentRoutes } from "../modules/appointments/appointment.routes";
import { sessionRoutes } from "../modules/sessions/session.routes";
import { messageRoutes } from "../modules/messages/message.routes";
import { paymentRoutes } from "../modules/payments/payment.routes";
import { adminRoutes } from "../modules/admin/admin.routes";
import { notificationRoutes } from "../modules/notifications/notification.routes";
import { reviewRoutes } from "../modules/reviews/review.routes";
import { crisisRoutes } from "../modules/crisis/crisis.routes";
import { packageRoutes } from "../modules/packages/package.routes";

export async function registerRoutes(app: FastifyInstance) {
  app.get("/", async () => ({ name: "WeCare4You API", version: "1.0.0", status: "ok", docs: "/documentation" }));
  app.get("/health", async () => ({ status: "ok", timestamp: new Date().toISOString() }));

  await app.register(authRoutes, { prefix: "/auth" });
  await app.register(userRoutes, { prefix: "/users" });
  await app.register(therapistRoutes, { prefix: "/therapists" });
  await app.register(buddyRoutes, { prefix: "/buddies" });
  await app.register(patientRoutes, { prefix: "/patients" });
  await app.register(appointmentRoutes, { prefix: "/appointments" });
  await app.register(sessionRoutes, { prefix: "/sessions" });
  await app.register(messageRoutes, { prefix: "" });
  await app.register(paymentRoutes, { prefix: "/payments" });
  await app.register(adminRoutes, { prefix: "/admin" });
  await app.register(notificationRoutes, { prefix: "/notifications" });
  await app.register(reviewRoutes, { prefix: "/reviews" });
  await app.register(crisisRoutes, { prefix: "/crisis" });
  await app.register(packageRoutes, { prefix: "/packages" });
}
