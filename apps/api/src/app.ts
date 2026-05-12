import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import sensible from "@fastify/sensible";
import { registerRedisPlugin } from "./plugins/redis.js";
import { registerScreenshotRoutes } from "./routes/screenshot.js";
import { registerHealthRoutes } from "./routes/health.js";
import { registerKeyRoutes } from "./routes/keys.js";
import { registerAuthRoutes } from "./routes/auth.js";
import { registerScheduleRoutes } from "./routes/schedules.js";
import { registerWebhookRoutes } from "./routes/webhooks.js";
import { registerOAuthRoutes } from "./routes/oauth.js";
import { registerAuthPlugin } from "./plugins/auth.js";
import { registerRateLimitPlugin } from "./plugins/rate-limit.js";
import { registerErrorHandler } from "./middleware/error-handler.js";
import type { Env } from "./config/env.js";

export async function buildApp(env: Env) {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === "development" ? "info" : "warn",
      transport:
        env.NODE_ENV === "development"
          ? { target: "pino-pretty", options: { colorize: true } }
          : undefined,
    },
  });

  // ── Core Plugins ────────────────────────────────────────────
  await app.register(cors, {
    origin: ["http://localhost:3300", "http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  });
  await app.register(jwt, {
    secret: process.env.JWT_SECRET || "super-secret-dev-key-change-me",
  });
  await app.register(sensible);

  // ── Custom Plugins ──────────────────────────────────────────
  await registerRedisPlugin(app, env);
  await registerAuthPlugin(app);
  await registerRateLimitPlugin(app, env);
  registerErrorHandler(app);

  // ── Routes ──────────────────────────────────────────────────
  await registerHealthRoutes(app);
  await registerScreenshotRoutes(app, env);
  await registerKeyRoutes(app);
  await registerAuthRoutes(app);
  await registerScheduleRoutes(app, env);
  await registerWebhookRoutes(app);
  await registerOAuthRoutes(app, env);

  return app;
}
