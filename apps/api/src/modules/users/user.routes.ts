import type { FastifyInstance } from "fastify";
import { authenticate } from "../../plugins/auth";
import { UserController } from "./user.controller";

export async function userRoutes(app: FastifyInstance) {
  const ctrl = new UserController();

  app.get("/me", { preHandler: authenticate }, (req, reply) => ctrl.getMe(req, reply));
  app.patch("/me", { preHandler: authenticate }, (req, reply) => ctrl.updateMe(req, reply));
  app.delete("/me", { preHandler: authenticate }, (req, reply) => ctrl.deleteMe(req, reply));
}
