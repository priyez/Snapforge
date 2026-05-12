import type { FastifyInstance } from "fastify";
import { prisma } from "@screenshot-api/db";
import { z } from "zod";
import crypto from "crypto";

export async function registerWebhookRoutes(app: FastifyInstance) {
  // ── GET /api/webhooks — List webhooks ──────────────────────────
  app.get("/api/webhooks", async (request, reply) => {
    if (!request.apiKey) {
      return reply.code(401).send({ success: false, error: { code: "UNAUTHORIZED" } });
    }

    const userId = request.apiKey.userId;

    try {
      const webhooks = await (prisma as any).webhook.findMany({
        where: { userId },
        include: {
          _count: {
            select: { logs: true }
          }
        },
        orderBy: { createdAt: "desc" },
      });

      return reply.send({
        success: true,
        data: webhooks,
      });
    } catch (err) {
      return reply.code(500).send({
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Failed to fetch webhooks" },
      });
    }
  });

  // ── POST /api/webhooks — Create webhook ─────────────────────────
  app.post("/api/webhooks", async (request, reply) => {
    if (!request.apiKey) {
      return reply.code(401).send({ success: false, error: { code: "UNAUTHORIZED" } });
    }

    const schema = z.object({
      url: z.string().url(),
      name: z.string().optional(),
      events: z.array(z.string()).default(["screenshot.completed"]),
    });

    const { url, name, events } = schema.parse(request.body);
    const userId = request.apiKey.userId;
    const secret = `whsec_${crypto.randomBytes(24).toString("hex")}`;

    try {
      const webhook = await (prisma as any).webhook.create({
        data: {
          userId,
          url,
          name,
          events,
          secret,
        },
      });

      return reply.code(201).send({
        success: true,
        data: webhook,
      });
    } catch (err) {
      return reply.code(500).send({
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Failed to create webhook" },
      });
    }
  });

  // ── DELETE /api/webhooks/:id — Delete webhook ───────────────────
  app.delete("/api/webhooks/:id", async (request, reply) => {
    if (!request.apiKey) {
      return reply.code(401).send({ success: false, error: { code: "UNAUTHORIZED" } });
    }

    const { id } = request.params as { id: string };
    const userId = request.apiKey.userId;

    try {
      await (prisma as any).webhook.delete({
        where: { id, userId },
      });

      return reply.send({
        success: true,
        data: { message: "Webhook deleted successfully" },
      });
    } catch (err) {
      return reply.code(500).send({
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Failed to delete webhook" },
      });
    }
  });

  // ── GET /api/webhooks/:id/logs — Webhook logs ──────────────────
  app.get("/api/webhooks/:id/logs", async (request, reply) => {
    if (!request.apiKey) {
      return reply.code(401).send({ success: false, error: { code: "UNAUTHORIZED" } });
    }

    const { id } = request.params as { id: string };
    const userId = request.apiKey.userId;

    try {
      const logs = await (prisma as any).webhookLog.findMany({
        where: {
          webhookId: id,
          webhook: { userId },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      return reply.send({
        success: true,
        data: logs,
      });
    } catch (err) {
      return reply.code(500).send({
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Failed to fetch webhook logs" },
      });
    }
  });
}
