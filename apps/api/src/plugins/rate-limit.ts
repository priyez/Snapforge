import type { FastifyInstance, FastifyRequest } from "fastify";
import rateLimit from "@fastify/rate-limit";
import { RATE_LIMITS, REDIS_KEYS } from "@screenshot-api/shared";
import type { Env } from "../config/env.js";

/**
 * Register rate limiting plugin.
 *
 * Configures @fastify/rate-limit to use Redis and keys requests by API key.
 * Limits are dynamically fetched based on the user's plan.
 */
export async function registerRateLimitPlugin(app: FastifyInstance, env: Env) {
  await app.register(rateLimit, {
    // Redis connection is managed by the redis plugin
    redis: app.redis,

    // Prefix for Redis keys
    keyGenerator: (request: FastifyRequest) => {
      // If authenticated, key by API Key ID
      if (request.apiKey) {
        return `${REDIS_KEYS.RATE_PREFIX}${request.apiKey.id}`;
      }
      // Fallback to IP if not authenticated (should be blocked by auth anyway for protected routes)
      return request.ip;
    },

    // Dynamic limit based on user plan
    max: (request: FastifyRequest) => {
      const plan = (request.apiKey?.userPlan || "FREE") as keyof typeof RATE_LIMITS;
      return RATE_LIMITS[plan]?.requestsPerMinute || RATE_LIMITS.FREE.requestsPerMinute;
    },

    // 1 minute window
    timeWindow: "1 minute",

    // Skip rate limiting in development if no API key is provided
    skipOnError: true,
    
    // Custom error response
    errorResponseBuilder: (request, context) => {
      return {
        success: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: `Rate limit exceeded. You are allowed ${context.max} requests per ${context.after}.`,
        },
      };
    },
  });
}
