import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { RATE_LIMITS, REDIS_KEYS } from "@screenshot-api/shared";

/**
 * Check if the user has exceeded their daily quota.
 */
export async function checkDailyQuota(
  request: FastifyRequest,
  reply: FastifyReply,
  app: FastifyInstance
) {
  const { apiKey } = request;
  if (!apiKey) return; // Skip if no API key (e.g. dev mode without auth)

  const plan = (apiKey.userPlan || "FREE") as keyof typeof RATE_LIMITS;
  const limit = RATE_LIMITS[plan]?.requestsPerDay || RATE_LIMITS.FREE.requestsPerDay;
  
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const quotaKey = `${REDIS_KEYS.QUOTA_PREFIX}${apiKey.userId}:${today}`;

  const currentUsage = await app.redis.get(quotaKey);
  const usage = currentUsage ? parseInt(currentUsage, 10) : 0;

  if (usage >= limit) {
    return reply.code(429).send({
      success: false,
      error: {
        code: "QUOTA_EXCEEDED",
        message: `Daily quota exceeded. Your plan (${plan}) allows ${limit} requests per day.`,
      },
    });
  }
}

/**
 * Increment the user's daily quota.
 */
export async function incrementDailyQuota(
  app: FastifyInstance,
  userId: string
) {
  const today = new Date().toISOString().split("T")[0];
  const quotaKey = `${REDIS_KEYS.QUOTA_PREFIX}${userId}:${today}`;

  const pipeline = app.redis.pipeline();
  pipeline.incr(quotaKey);
  pipeline.expire(quotaKey, 60 * 60 * 48); // 48 hour TTL
  await pipeline.exec();
}
