import type { FastifyInstance } from "fastify";
import { authenticate } from "../../plugins/auth";
import { ReviewController } from "./review.controller";

export async function reviewRoutes(app: FastifyInstance) {
  const ctrl = new ReviewController();

  app.post("/", { preHandler: authenticate }, (req, reply) => ctrl.create(req, reply));
  app.get("/provider/:userId", (req, reply) => ctrl.getProviderReviews(req, reply));
}
