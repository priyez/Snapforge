import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@screenshot-api/db";
import { generateApiKey } from "../plugins/auth.js";

export async function registerKeyRoutes(app: FastifyInstance) {
  // ── POST /api/keys — Create a new API key ──────────────────
  app.post("/api/keys", async (request, reply) => {
    if (!request.apiKey) {
      return reply.code(401).send({ success: false, error: { code: "UNAUTHORIZED" } });
    }

    const bodySchema = z.object({
      name: z.string().max(100).default("Default"),
    });

    const parseResult = bodySchema.safeParse(request.body);
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

    const { name } = parseResult.data;
    const userId = request.apiKey.userId;
    const { rawKey, hashedKey, prefix } = generateApiKey();

    const apiKey = await prisma.apiKey.create({
      data: {
        name,
        prefix,
        hashedKey,
        userId,
      },
    });

    // Return the raw key ONCE — it cannot be retrieved again
    return reply.code(201).send({
      success: true,
      data: {
        id: apiKey.id,
        name: apiKey.name,
        key: rawKey, // ⚠️ Only shown once!
        prefix: apiKey.prefix,
        createdAt: apiKey.createdAt.toISOString(),
      },
    });
  });

  // ── GET /api/keys — List user's API keys ────────────────────
  app.get("/api/keys", async (request, reply) => {
    if (!request.apiKey) {
      return reply.code(401).send({ success: false, error: { code: "UNAUTHORIZED" } });
    }

    const userId = request.apiKey.userId;

    const keys = await prisma.apiKey.findMany({
      where: { userId, revoked: false },
      select: {
        id: true,
        name: true,
        prefix: true,
        lastUsedAt: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return reply.send({
      success: true,
      data: keys,
    });
  });

  // ── DELETE /api/keys/:id — Revoke an API key ────────────────
  app.delete("/api/keys/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      await prisma.apiKey.update({
        where: { id },
        data: { revoked: true },
      });

      return reply.send({
        success: true,
        data: { message: "API key revoked successfully" },
      });
    } catch {
      return reply.code(404).send({
        success: false,
        error: { code: "NOT_FOUND", message: "API key not found" },
      });
    }
  });
}
