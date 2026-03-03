import type { FastifyInstance } from "fastify";
import { authenticate, requireRole } from "../../plugins/auth";
import { PaymentController } from "./payment.controller";

export async function paymentRoutes(app: FastifyInstance) {
  const ctrl = new PaymentController();

  app.post("/initialize", { preHandler: authenticate }, (req, reply) =>
    ctrl.initialize(req, reply)
  );
  app.get("/verify/:reference", { preHandler: authenticate }, (req, reply) =>
    ctrl.verify(req, reply)
  );
  // Paystack webhook — no auth, verified by secret
  app.post("/webhook", (req, reply) => ctrl.webhook(req, reply));
  app.post("/payout/:appointmentId", { preHandler: requireRole("ADMIN") }, (req, reply) =>
    ctrl.triggerPayout(req, reply)
  );
  app.get("/banks", { preHandler: authenticate }, (req, reply) => ctrl.listBanks(req, reply));
  app.post("/onboard-bank", { preHandler: authenticate }, (req, reply) =>
    ctrl.onboardBank(req, reply)
  );
}
