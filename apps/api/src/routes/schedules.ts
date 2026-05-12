import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { Queue } from "bullmq";
import { prisma } from "@screenshot-api/db";
import { QUEUE_NAMES, LIMITS, DEFAULTS } from "@screenshot-api/shared";
import type { Env } from "../config/env.js";

const scheduleSchema = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url().max(LIMITS.MAX_URL_LENGTH),
  cron: z.string().min(1),
  width: z.number().int().min(LIMITS.MIN_WIDTH).max(LIMITS.MAX_WIDTH).default(DEFAULTS.WIDTH),
  height: z.number().int().min(LIMITS.MIN_HEIGHT).max(LIMITS.MAX_HEIGHT).default(DEFAULTS.HEIGHT),
  options: z.record(z.any()).optional(),
});

export async function registerScheduleRoutes(app: FastifyInstance, env: Env) {
  // Create queue producer for repeatable jobs
  const queue = new Queue(QUEUE_NAMES.SCREENSHOT, {
    connection: { url: env.REDIS_URL },
  });

  // Cleanup on close
  app.addHook("onClose", async () => {
    await queue.close();
  });

  // ── GET /api/screenshot/schedules — List schedules ───────────
  app.get("/api/screenshot/schedules", async (request, reply) => {
    if (!request.apiKey) {
      return reply.code(401).send({ success: false, error: { code: "UNAUTHORIZED" } });
    }

    const schedules = await prisma.schedule.findMany({
      where: { userId: request.apiKey.userId },
      orderBy: { createdAt: "desc" },
    });

    return reply.send({
      success: true,
      data: schedules,
    });
  });

  // ── GET /api/screenshot/schedules/:id — Get single schedule ───
  app.get("/api/screenshot/schedules/:id", async (request, reply) => {
    if (!request.apiKey) {
      return reply.code(401).send({ success: false, error: { code: "UNAUTHORIZED" } });
    }

    const { id } = request.params as { id: string };
    const userId = request.apiKey.userId;

    const schedule = await prisma.schedule.findFirst({
      where: { id, userId },
    });

    if (!schedule) {
      return reply.code(404).send({ success: false, error: { code: "NOT_FOUND" } });
    }

    return reply.send({
      success: true,
      data: schedule,
    });
  });

  // ── POST /api/screenshot/schedules — Create schedule ─────────
  app.post("/api/screenshot/schedules", async (request, reply) => {
    if (!request.apiKey) {
      return reply.code(401).send({ success: false, error: { code: "UNAUTHORIZED" } });
    }

    const parseResult = scheduleSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.code(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request body",
          details: parseResult.error.flatten().fieldErrors,
        },
      });
    }

    const { name, url, cron, width, height, options } = parseResult.data;
    const userId = request.apiKey.userId;

    try {
      // Create in DB
      const schedule = await prisma.schedule.create({
        data: {
          userId,
          name,
          url,
          cron,
          options: {
            ...(options || {}),
            width,
            height,
          },
        },
      });

      // Add repeatable job to BullMQ
      // Job ID is used to identify the repeatable job for removal later
      await queue.add(
        "screenshot",
        {
          url,
          width,
          height,
          ...options,
          userId,
          scheduleId: schedule.id,
        },
        {
          repeat: { pattern: cron },
          jobId: `schedule_${schedule.id}`,
        }
      );

      return reply.code(201).send({
        success: true,
        data: schedule,
      });
    } catch (err) {
      app.log.error({ err }, "Failed to create schedule");
      return reply.code(500).send({
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Failed to create schedule" },
      });
    }
  });

  // ── PATCH /api/screenshot/schedules/:id — Update schedule ──────
  app.patch("/api/screenshot/schedules/:id", async (request, reply) => {
    if (!request.apiKey) {
      return reply.code(401).send({ success: false, error: { code: "UNAUTHORIZED" } });
    }

    const { id } = request.params as { id: string };
    const userId = request.apiKey.userId;

    const parseResult = scheduleSchema.partial().safeParse(request.body);
    if (!parseResult.success) {
      return reply.code(400).send({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid request body" },
      });
    }

    const updates = parseResult.data;

    try {
      const schedule = await prisma.schedule.findFirst({
        where: { id, userId },
      });

      if (!schedule) {
        return reply.code(404).send({ success: false, error: { code: "NOT_FOUND" } });
      }

      // Update in DB
      const updatedSchedule = await prisma.schedule.update({
        where: { id },
        data: {
          name: updates.name,
          url: updates.url,
          cron: updates.cron,
          options: updates.width || updates.height || updates.options ? {
            ...(schedule.options as any || {}),
            ...(updates.options || {}),
            width: updates.width ?? (schedule.options as any)?.width,
            height: updates.height ?? (schedule.options as any)?.height,
          } : undefined,
        },
      });

      // If cron or url or dimensions changed, we must update the BullMQ repeatable job
      if (updates.cron || updates.url || updates.width || updates.height || updates.options) {
        // Remove old job
        const repeatableJobs = await queue.getRepeatableJobs();
        const oldJob = repeatableJobs.find((j) => j.id === `schedule_${id}`);
        if (oldJob) {
          await queue.removeRepeatableByKey(oldJob.key);
        }

        // Add new job with updated data/pattern
        await queue.add(
          "screenshot",
          {
            url: updatedSchedule.url,
            userId,
            scheduleId: id,
            ...(updatedSchedule.options as any || {}),
          },
          {
            repeat: { pattern: updatedSchedule.cron },
            jobId: `schedule_${id}`,
          }
        );
      }

      return reply.send({
        success: true,
        data: updatedSchedule,
      });
    } catch (err) {
      app.log.error({ err }, "Failed to update schedule");
      return reply.code(500).send({
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Failed to update schedule" },
      });
    }
  });

  // ── DELETE /api/screenshot/schedules/:id — Delete schedule ───
  app.delete("/api/screenshot/schedules/:id", async (request, reply) => {
    if (!request.apiKey) {
      return reply.code(401).send({ success: false, error: { code: "UNAUTHORIZED" } });
    }

    const { id } = request.params as { id: string };
    const userId = request.apiKey.userId;

    try {
      const schedule = await prisma.schedule.findFirst({
        where: { id, userId },
      });

      if (!schedule) {
        return reply.code(404).send({
          success: false,
          error: { code: "NOT_FOUND", message: "Schedule not found" },
        });
      }

      // Remove from BullMQ
      // We need to find the repeatable job to remove it
      const repeatableJobs = await queue.getRepeatableJobs();
      const job = repeatableJobs.find((j) => j.id === `schedule_${id}`);
      if (job) {
        await queue.removeRepeatableByKey(job.key);
      }

      // Delete from DB
      await prisma.schedule.delete({
        where: { id },
      });

      return reply.send({
        success: true,
        data: { message: "Schedule deleted successfully" },
      });
    } catch (err) {
      app.log.error({ err }, "Failed to delete schedule");
      return reply.code(500).send({
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Failed to delete schedule" },
      });
    }
  });

  // ── GET /api/screenshot/schedules/:id/history — Schedule history ─
  app.get("/api/screenshot/schedules/:id/history", async (request, reply) => {
    if (!request.apiKey) {
      return reply.code(401).send({ success: false, error: { code: "UNAUTHORIZED" } });
    }

    const { id } = request.params as { id: string };
    const userId = request.apiKey.userId;

    try {
      const history = await prisma.screenshotJob.findMany({
        where: {
          scheduleId: id,
          userId,
        },
        orderBy: { createdAt: "desc" },
        take: 30, // Last 30 days/runs
      });

      return reply.send({
        success: true,
        data: history,
      });
    } catch (err) {
      return reply.code(500).send({
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Failed to fetch schedule history" },
      });
    }
  });
}
