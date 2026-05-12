import { Worker, type Job } from "bullmq";
import { Redis } from "ioredis";
import {
  QUEUE_NAMES,
  REDIS_KEYS,
  LIMITS,
  type ScreenshotJobData,
  type ScreenshotResponse,
} from "@screenshot-api/shared";
import { takeScreenshot } from "./browser/screenshot.js";
import { generateStorageKey, type StorageAdapter } from "./storage/interface.js";
import type { WorkerEnv } from "./config/env.js";
import { prisma } from "@screenshot-api/db";
import axios from "axios";
import crypto from "crypto";
import { compareScreenshots } from "./lib/diff.js";

/**
 * Create and start the screenshot processing worker.
 */
export function createProcessor(env: WorkerEnv, storage: StorageAdapter): Worker {
  const redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

  const worker = new Worker<ScreenshotJobData, ScreenshotResponse>(
    QUEUE_NAMES.SCREENSHOT,
    async (job: Job<ScreenshotJobData>) => {
      const { data } = job;

      console.log(`📸 Processing job ${job.id} — ${data.url}`);
      await job.updateProgress(10);

      // Create job record in DB
      const dbJob = await (prisma as any).screenshotJob.create({
        data: {
          id: job.id,
          userId: data.userId || "anonymous",
          url: data.url,
          options: data as any,
          status: "PROCESSING",
          scheduleId: data.scheduleId,
        },
      });

      try {
        // Take screenshot
        const result = await takeScreenshot({
          url: data.url,
          width: data.width,
          height: data.height,
          fullPage: data.fullPage,
          format: data.format,
          quality: data.quality,
          delay: data.delay,
          selector: data.selector,
          darkMode: data.darkMode,
          deviceName: data.deviceName,
          customCss: data.customCss,
          customJs: data.customJs,
          blockAds: data.blockAds,
        });

        await job.updateProgress(50);

        // Upload to storage
        const storageKey = generateStorageKey(data.cacheKey, data.format);
        const imageUrl = await storage.upload(storageKey, result.buffer, result.contentType);

        await job.updateProgress(70);

        let diffPercentage: number | undefined;
        let diffImageUrl: string | undefined;
        let baselineId: string | undefined;

        // Perform diffing if this is a scheduled job
        if (data.scheduleId) {
          const previousJob = await (prisma as any).screenshotJob.findFirst({
            where: {
              scheduleId: data.scheduleId,
              status: "COMPLETED",
              id: { not: job.id },
            },
            orderBy: { createdAt: "desc" },
          });

          if (previousJob?.imageUrl) {
            try {
              const baselineResponse = await axios.get(previousJob.imageUrl, { responseType: "arraybuffer" });
              const baselineBuffer = Buffer.from(baselineResponse.data);

              const diffResult = await compareScreenshots(baselineBuffer, result.buffer);
              
              diffPercentage = diffResult.diffPercentage;
              baselineId = previousJob.id;

              if (diffResult.diffBuffer && diffPercentage > 0.1) {
                const diffKey = `diffs/${job.id}.png`;
                diffImageUrl = await storage.upload(diffKey, diffResult.diffBuffer, "image/png");
                console.log(`🔍 Diff detected: ${diffPercentage.toFixed(2)}% — ${diffImageUrl}`);
              }
            } catch (diffErr) {
              console.error("❌ Diffing failed:", diffErr);
            }
          }
        }

        await job.updateProgress(90);

        // Build response
        const response: ScreenshotResponse = {
          imageUrl,
          format: data.format,
          width: data.width,
          height: data.height,
          renderTimeMs: result.renderTimeMs,
          cached: false,
          expiresAt: new Date(Date.now() + LIMITS.CACHE_TTL * 1000).toISOString(),
        };

        // Update DB
        await (prisma as any).screenshotJob.update({
          where: { id: dbJob.id },
          data: {
            status: "COMPLETED",
            imageUrl,
            renderTimeMs: result.renderTimeMs,
            completedAt: new Date(),
            diffPercentage,
            diffImageUrl,
            baselineId,
          },
        });

        // Update schedule lastRunAt
        if (data.scheduleId) {
          await (prisma as any).schedule.update({
            where: { id: data.scheduleId },
            data: { lastRunAt: new Date() },
          }).catch(() => {});
        }

        // Cache the result in Redis
        await redis.setex(
          `${REDIS_KEYS.CACHE_PREFIX}${data.cacheKey}`,
          LIMITS.CACHE_TTL,
          JSON.stringify(response)
        );

        await job.updateProgress(100);

        console.log(`✅ Job ${job.id} completed — ${imageUrl}`);

        // Fire Webhooks
        const webhookPayload = {
          jobId: job.id!,
          status: "completed",
          ...response,
        };
        
        await fireWebhooks(data.userId || "anonymous", "screenshot.completed", webhookPayload);
        
        if ((diffPercentage || 0) > 1) {
          await fireWebhooks(data.userId || "anonymous", "diff.detected", {
            ...webhookPayload,
            diffPercentage,
            diffImageUrl,
          });

          // Send Global Alerts (Email, Slack, Discord, etc)
          await sendAlerts(data.userId || "anonymous", {
            url: data.url,
            imageUrl,
            diffImageUrl,
          }, diffPercentage || 0);
        }

        return response;
      } catch (err: any) {
        // Update DB on failure
        await (prisma as any).screenshotJob.update({
          where: { id: dbJob.id },
          data: {
            status: "FAILED",
            errorMessage: err.message,
          },
        }).catch(() => {});

        // Fire failure webhooks
        await fireWebhooks(data.userId || "anonymous", "screenshot.failed", {
          jobId: job.id!,
          status: "failed",
          error: err.message,
        });

        throw err;
      }
    },
    {
      connection: { url: env.REDIS_URL },
      concurrency: env.WORKER_CONCURRENCY,
      limiter: {
        max: env.WORKER_CONCURRENCY * 2,
        duration: 1000,
      },
      stalledInterval: 30000,
      lockDuration: 60000,
    }
  );

  // ── Worker Event Handlers ───────────────────────────────────

  worker.on("completed", (job) => {
    console.log(`🎉 Job ${job.id} completed successfully`);
  });

  worker.on("failed", (job, err) => {
    console.error(`💥 Job ${job?.id} failed:`, err.message);
  });

  worker.on("error", (err) => {
    console.error("❌ Worker error:", err);
  });

  worker.on("stalled", (jobId) => {
    console.warn(`⚠️ Job ${jobId} stalled`);
  });

  return worker;
}

/**
 * Fire all active webhooks for the user that match the event type.
 */
async function fireWebhooks(userId: string, event: string, payload: any): Promise<void> {
  const webhooks = await (prisma as any).webhook.findMany({
    where: { userId, active: true },
  });

  const matchingWebhooks = webhooks.filter((w: any) => w.events.includes(event));

  await Promise.all(matchingWebhooks.map(async (webhook: any) => {
    const start = Date.now();
    let success = false;
    let statusCode: number | undefined;
    let responseBody: string | undefined;

    try {
      const response = await axios.post(webhook.url, payload, {
        headers: { 
          "Content-Type": "application/json",
          "X-SnapForge-Signature": crypto.createHmac("sha256", webhook.secret).update(JSON.stringify(payload)).digest("hex"),
          "X-SnapForge-Event": event
        },
        timeout: 10000,
      });
      success = true;
      statusCode = response.status;
      responseBody = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
    } catch (err: any) {
      success = false;
      statusCode = err.response?.status;
      responseBody = err.message;
    } finally {
      const durationMs = Date.now() - start;
      await (prisma as any).webhookLog.create({
        data: {
          webhookId: webhook.id,
          event,
          payload: payload as any,
          statusCode,
          responseBody: responseBody?.substring(0, 1000),
          success,
          durationMs,
        },
      }).catch(() => {});
    }
  }));
}

/**
 * Send Global Alerts (Email, Slack, Discord, Telegram) based on user settings.
 */
async function sendAlerts(userId: string, job: any, diffPercentage: number): Promise<void> {
  const user = await (prisma as any).user.findUnique({
    where: { id: userId },
  });

  if (!user || diffPercentage < user.alertThreshold) return;

  const message = `🚨 Visual Change Detected!\n\nURL: ${job.url}\nChange: ${diffPercentage.toFixed(2)}%\nView Diff: ${job.diffImageUrl}\nOriginal: ${job.imageUrl}`;

  // 1. Slack
  if (user.slackWebhook) {
    await axios.post(user.slackWebhook, { text: message }).catch(() => {});
  }

  // 2. Discord
  if (user.discordWebhook) {
    await axios.post(user.discordWebhook, { content: message }).catch(() => {});
  }

  // 3. Telegram
  if (user.telegramChatId && process.env.TELEGRAM_BOT_TOKEN) {
    await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: user.telegramChatId,
      text: message,
    }).catch(() => {});
  }

  // 4. Email (Using simple log for now, could integrate Resend/Nodemailer)
  if (user.emailAlerts) {
    console.log(`📧 Sending Email Alert to ${user.email} for ${diffPercentage.toFixed(2)}% change on ${job.url}`);
    // Integration with Resend would go here
  }
}
