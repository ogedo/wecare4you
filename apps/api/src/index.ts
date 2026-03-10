import "dotenv/config";
import Fastify from "fastify";
import { env } from "./lib/env";
import { registerPlugins } from "./plugins";
import { registerRoutes } from "./routes";
import { setupSocketIO } from "./plugins/socket";
import { registerReminderJob } from "./jobs/reminder.job";

async function main() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === "production" ? "warn" : "info",
      transport:
        env.NODE_ENV === "development"
          ? { target: "pino-pretty", options: { colorize: true } }
          : undefined,
    },
  });

  await registerPlugins(app);
  await registerRoutes(app);

  // Socket.io must be set up after routes but before listen
  await setupSocketIO(app);

  try {
    await app.listen({ port: env.API_PORT, host: env.API_HOST });
    app.log.info(`WeCare4You API running on ${env.API_HOST}:${env.API_PORT}`);

    // Start cron jobs after server is up (io is available)
    registerReminderJob(app);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
