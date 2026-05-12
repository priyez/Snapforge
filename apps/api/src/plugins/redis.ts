import type { FastifyInstance } from "fastify";
import Redis from "ioredis";
import type { Env } from "../config/env.js";

declare module "fastify" {
  interface FastifyInstance {
    redis: Redis;
  }
}

export async function registerRedisPlugin(app: FastifyInstance, env: Env) {
  const redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null, // Required for BullMQ
    enableReadyCheck: false,
    retryStrategy(times: number) {
      const delay = Math.min(times * 200, 5000);
      return delay;
    },
  });

  redis.on("connect", () => {
    app.log.info("✅ Redis connected");
  });

  redis.on("error", (err) => {
    app.log.error({ err }, "❌ Redis connection error");
  });

  // Decorate Fastify instance with Redis client
  app.decorate("redis", redis);

  // Cleanup on close
  app.addHook("onClose", async () => {
    await redis.quit();
  });
}
