import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { Queue, QueueEvents } from "bullmq";
import {
  DEFAULTS,
  LIMITS,
  REDIS_KEYS,
  QUEUE_NAMES,
  validateUrlFormat,
  generateCacheKey,
  type ScreenshotJobData,
  type ApiResponse,
  type ScreenshotResponse,
  type AsyncScreenshotResponse,
  validateUrl,
  getDevicePreset,
  R2StorageAdapter,
  LocalStorageAdapter,
  type StorageAdapter,
  generateStorageKey
} from "@screenshot-api/shared";
import type { Env } from "../config/env.js";
import { checkDailyQuota, incrementDailyQuota } from "../plugins/quota.js";
import { prisma } from "@screenshot-api/db";
import { takeDirectScreenshot } from "../lib/direct-screenshot.js";
import { getStorageAdapter } from "../lib/storage.js";

// ── Request Validation Schemas ──────────────────────────────────

const screenshotQuerySchema = z.object({
  url: z.string().url().max(LIMITS.MAX_URL_LENGTH),
  width: z.coerce.number().int().min(LIMITS.MIN_WIDTH).max(LIMITS.MAX_WIDTH).default(DEFAULTS.WIDTH),
  height: z.coerce.number().int().min(LIMITS.MIN_HEIGHT).max(LIMITS.MAX_HEIGHT).default(DEFAULTS.HEIGHT),
  fullPage: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .default("false"),
  format: z.enum(["png", "jpeg", "webp"]).default(DEFAULTS.FORMAT),
  quality: z.coerce.number().int().min(1).max(100).optional(),
  delay: z.coerce.number().int().min(0).max(LIMITS.MAX_DELAY).optional(),
  selector: z.string().max(500).optional(),
  darkMode: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  deviceName: z.string().max(100).optional(),
  blockAds: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
});

const screenshotBodySchema = z.object({
  url: z.string().url().max(LIMITS.MAX_URL_LENGTH),
  width: z.number().int().min(LIMITS.MIN_WIDTH).max(LIMITS.MAX_WIDTH).default(DEFAULTS.WIDTH),
  height: z.number().int().min(LIMITS.MIN_HEIGHT).max(LIMITS.MAX_HEIGHT).default(DEFAULTS.HEIGHT),
  fullPage: z.boolean().default(DEFAULTS.FULL_PAGE),
  format: z.enum(["png", "jpeg", "webp"]).default(DEFAULTS.FORMAT),
  quality: z.number().int().min(1).max(100).optional(),
  delay: z.number().int().min(0).max(LIMITS.MAX_DELAY).optional(),
  selector: z.string().max(500).optional(),
  darkMode: z.boolean().optional(),
  deviceName: z.string().max(100).optional(),
  blockAds: z.boolean().optional(),
  customCss: z.string().max(LIMITS.MAX_CSS_LENGTH).optional(),
  customJs: z.string().max(LIMITS.MAX_JS_LENGTH).optional(),
  async: z.boolean().default(false),
  webhookUrl: z.string().url().optional(),
});

/**
 * Helper to process a screenshot directly without a worker.
 */
async function processScreenshotDirectly(options: any, cacheKey: string, app: FastifyInstance) {
  // Create job record in DB
  const dbJob = await prisma.screenshotJob.create({
    data: {
      id: `direct_${cacheKey}_${Date.now()}`,
      userId: options.userId || "anonymous",
      url: options.url,
      options: options as any,
      status: "PROCESSING",
    },
  });

  try {
    // Take screenshot
    const result = await takeDirectScreenshot(options);
    
    // Upload to storage
    const storage = getStorageAdapter();
    const storageKey = generateStorageKey(cacheKey, options.format);
    const imageUrl = await storage.upload(storageKey, result.buffer, result.contentType);

    const response: ScreenshotResponse = {
      imageUrl,
      format: options.format,
      width: options.width,
      height: options.height,
      renderTimeMs: result.renderTimeMs,
      cached: false,
      expiresAt: new Date(Date.now() + LIMITS.CACHE_TTL * 1000).toISOString(),
    };

    // Update DB to COMPLETED
    await prisma.screenshotJob.update({
      where: { id: dbJob.id },
      data: {
        status: "COMPLETED",
        imageUrl,
        renderTimeMs: result.renderTimeMs,
        completedAt: new Date(),
      },
    });

    // Cache in Redis
    await app.redis.setex(
      `${REDIS_KEYS.CACHE_PREFIX}${cacheKey}`,
      LIMITS.CACHE_TTL,
      JSON.stringify(response)
    );

    return response;
  } catch (err: any) {
    // Update DB to FAILED
    await prisma.screenshotJob.update({
      where: { id: dbJob.id },
      data: {
        status: "FAILED",
        errorMessage: err.message,
      },
    }).catch(() => {});
    throw err;
  }
}

// ── Route Registration ──────────────────────────────────────────

export async function registerScreenshotRoutes(app: FastifyInstance, env: Env) {
  const connectionOptions = {
    url: env.REDIS_URL,
    maxRetriesPerRequest: null,
  };

  // Create queue producer
  const queue = new Queue(QUEUE_NAMES.SCREENSHOT, {
    connection: connectionOptions,
  });

  const queueEvents = new QueueEvents(QUEUE_NAMES.SCREENSHOT, {
    connection: connectionOptions,
  });

  // Cleanup on close
  app.addHook("onClose", async () => {
    await Promise.all([
      queue.close(),
      queueEvents.close()
    ]);
  });

  // ── GET /api/screenshot — Synchronous screenshot ────────────
  app.get("/api/screenshot", {
    preHandler: async (request, reply) => {
      await checkDailyQuota(request, reply, app);
    },
  }, async (request, reply) => {
    // Validate query params
    const parseResult = screenshotQuerySchema.safeParse(request.query);
    if (!parseResult.success) {
      return reply.code(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid parameters",
          details: parseResult.error.flatten().fieldErrors,
        },
      } satisfies ApiResponse);
    }

    const options = parseResult.data;

    // SSRF validation
    const urlCheck = validateUrlFormat(options.url);
    if (!urlCheck.valid) {
      return reply.code(400).send({
        success: false,
        error: {
          code: "INVALID_URL",
          message: urlCheck.reason || "URL is not allowed",
        },
      } satisfies ApiResponse);
    }

    // Generate cache key
    const cacheKey = generateCacheKey({
      ...options,
      fullPage: options.fullPage ?? DEFAULTS.FULL_PAGE,
      darkMode: options.darkMode ?? DEFAULTS.DARK_MODE,
      blockAds: options.blockAds ?? DEFAULTS.BLOCK_ADS,
    });

    // Check cache
    const cached = await app.redis.get(`${REDIS_KEYS.CACHE_PREFIX}${cacheKey}`);
    if (cached) {
      const cachedResult = JSON.parse(cached) as ScreenshotResponse;
      // Increment quota for cached requests too
      const userId = request.apiKey?.userId || (request.user as any)?.sub || "anonymous";
      if (userId !== "anonymous") {
        await incrementDailyQuota(app, userId);
      }
      return reply.send({
        success: true,
        data: { ...cachedResult, cached: true },
      } satisfies ApiResponse<ScreenshotResponse>);
    }

    // Generate User ID (API Key > Session > Anonymous)
    const userId = request.apiKey?.userId || (request.user as any)?.sub || "anonymous";

    // Enqueue job
    const jobData: ScreenshotJobData = {
      ...options,
      fullPage: options.fullPage ?? DEFAULTS.FULL_PAGE,
      darkMode: options.darkMode ?? DEFAULTS.DARK_MODE,
      blockAds: options.blockAds ?? DEFAULTS.BLOCK_ADS,
      cacheKey,
      userId,
    };

    app.log.info({ userId, url: options.url }, "Processing screenshot request");

    // Direct Mode (Bypass Worker)
    if (env.DIRECT_SCREENSHOT) {
      try {
        const result = await processScreenshotDirectly(jobData, cacheKey, app);
        if (userId !== "anonymous") await incrementDailyQuota(app, userId);
        return reply.send({ success: true, data: result });
      } catch (err: any) {
        app.log.error({ err }, "Direct screenshot failed");
        return reply.code(500).send({ success: false, error: { code: "INTERNAL_ERROR", message: err.message } });
      }
    }

    const job = await queue.add("screenshot", jobData, {
      jobId: cacheKey, // Deduplicate by cache key
      removeOnComplete: true,
      removeOnFail: true,
    });

    // Increment quota
    if (request.apiKey) {
      await incrementDailyQuota(app, request.apiKey.userId);
    }

    // Wait for completion (sync mode)
    try {
      const result = await job.waitUntilFinished(queueEvents, LIMITS.MAX_TIMEOUT);

      return reply.send({
        success: true,
        data: result as ScreenshotResponse,
      } satisfies ApiResponse<ScreenshotResponse>);
    } catch (err: any) {
      app.log.error({ err, jobId: job.id }, "Screenshot job waiting failed");
      return reply.code(504).send({
        success: false,
        error: {
          code: "TIMEOUT",
          message: `Screenshot generation failed: ${err.message}. Try async mode with POST.`,
        },
      } satisfies ApiResponse);
    }
  });

  // ── POST /api/screenshot — Supports async mode ─────────────
  app.post("/api/screenshot", {
    preHandler: async (request, reply) => {
      await checkDailyQuota(request, reply, app);
    },
  }, async (request, reply) => {
    const parseResult = screenshotBodySchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.code(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request body",
          details: parseResult.error.flatten().fieldErrors,
        },
      } satisfies ApiResponse);
    }

    const options = parseResult.data;

    // SSRF validation
    const urlCheck = validateUrlFormat(options.url);
    if (!urlCheck.valid) {
      return reply.code(400).send({
        success: false,
        error: { code: "INVALID_URL", message: urlCheck.reason || "URL is not allowed" },
      } satisfies ApiResponse);
    }

    // Webhook URL SSRF check
    if (options.webhookUrl) {
      const webhookCheck = validateUrlFormat(options.webhookUrl);
      if (!webhookCheck.valid) {
        return reply.code(400).send({
          success: false,
          error: { code: "INVALID_WEBHOOK_URL", message: webhookCheck.reason || "Webhook URL is not allowed" },
        } satisfies ApiResponse);
      }
    }

    const cacheKey = generateCacheKey(options);

    // Check cache
    const cached = await app.redis.get(`${REDIS_KEYS.CACHE_PREFIX}${cacheKey}`);
    if (cached) {
      const cachedResult = JSON.parse(cached) as ScreenshotResponse;
      // Increment quota for cached requests too
      const userId = request.apiKey?.userId || (request.user as any)?.sub || "anonymous";
      if (userId !== "anonymous") {
        await incrementDailyQuota(app, userId);
      }
      return reply.send({
        success: true,
        data: { ...cachedResult, cached: true },
      } satisfies ApiResponse<ScreenshotResponse>);
    }

    // Generate User ID (API Key > Session > Anonymous)
    const userId = request.apiKey?.userId || (request.user as any)?.sub || "anonymous";

    // Enqueue job
    const jobData: ScreenshotJobData = {
      ...options,
      cacheKey,
      userId,
    };

    app.log.info({ userId, url: options.url }, "Processing screenshot request (POST)");

    // Direct Mode (Bypass Worker)
    if (env.DIRECT_SCREENSHOT) {
      try {
        const result = await processScreenshotDirectly(jobData, cacheKey, app);
        if (userId !== "anonymous") await incrementDailyQuota(app, userId);
        return reply.send({ success: true, data: result });
      } catch (err: any) {
        app.log.error({ err }, "Direct screenshot failed");
        return reply.code(500).send({ success: false, error: { code: "INTERNAL_ERROR", message: err.message } });
      }
    }

    const job = await queue.add("screenshot", jobData, {
      jobId: cacheKey, // Deduplicate by cache key
      removeOnComplete: true,
      removeOnFail: true,
    });

    // Increment quota
    if (request.apiKey) {
      await incrementDailyQuota(app, request.apiKey.userId);
    }

    // Async mode — return immediately with job ID
    if (options.async) {
      return reply.code(202).send({
        success: true,
        data: {
          jobId: job.id!,
          status: "queued",
          statusUrl: `/api/screenshot/${job.id}`,
        },
      } satisfies ApiResponse<AsyncScreenshotResponse>);
    }

    // Sync mode — wait for result
    try {
      const result = await job.waitUntilFinished(queueEvents, LIMITS.MAX_TIMEOUT);

      return reply.send({
        success: true,
        data: result as ScreenshotResponse,
      } satisfies ApiResponse<ScreenshotResponse>);
    } catch (err: any) {
      app.log.error({ err, jobId: job.id }, "Screenshot job waiting failed");
      return reply.code(504).send({
        success: false,
        error: {
          code: "TIMEOUT",
          message: `Screenshot generation failed: ${err.message}. Try async mode.`,
        },
      } satisfies ApiResponse);
    }
  });

  // ── GET /api/screenshot/:jobId — Poll job status ────────────
  app.get("/api/screenshot/:jobId", async (request, reply) => {
    const { jobId } = request.params as { jobId: string };

    const job = await queue.getJob(jobId);
    if (!job) {
      return reply.code(404).send({
        success: false,
        error: { code: "NOT_FOUND", message: "Job not found" },
      } satisfies ApiResponse);
    }

    const state = await job.getState();
    const result = job.returnvalue;

    return reply.send({
      success: true,
      data: {
        jobId: job.id,
        status: state === "completed" ? "completed" : state === "failed" ? "failed" : "processing",
        ...(result ? (result as ScreenshotResponse) : {}),
        ...(state === "failed" ? { error: job.failedReason } : {}),
      },
    });
  });

  // ── GET /api/screenshot/history — List recent jobs ──────────
  app.get("/api/screenshot/history", async (request, reply) => {
    if (!request.apiKey) {
      return reply.code(401).send({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      });
    }

    try {
      const jobs = await prisma.screenshotJob.findMany({
        where: { userId: request.apiKey.userId },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      return reply.send({
        success: true,
        data: jobs,
      });
    } catch (err) {
      app.log.error({ err }, "Failed to fetch screenshot history");
      return reply.code(500).send({
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Failed to fetch history" },
      });
    }
  });
}
