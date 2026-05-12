import { createHash, randomBytes } from "node:crypto";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "@screenshot-api/db";

// ── Types ───────────────────────────────────────────────────────

declare module "fastify" {
  interface FastifyRequest {
    apiKey?: {
      id: string;
      userId: string;
      userPlan: string;
    };
  }
}

// ── Helpers ─────────────────────────────────────────────────────

/**
 * Generate a new API key with a visible prefix.
 * Returns both the raw key (shown once) and the hash (stored in DB).
 */
export function generateApiKey(): { rawKey: string; hashedKey: string; prefix: string } {
  const raw = randomBytes(32).toString("hex");
  const rawKey = `sfg_live_${raw}`;
  const hashedKey = createHash("sha256").update(rawKey).digest("hex");
  const prefix = `sfg_live_${raw.slice(0, 8)}`;

  return { rawKey, hashedKey, prefix };
}

/**
 * Hash an API key for lookup.
 */
export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

// ── Plugin ──────────────────────────────────────────────────────

export async function registerAuthPlugin(app: FastifyInstance) {
  app.decorateRequest("apiKey", undefined);

  // Auth hook — runs on all /api/* routes except health and auth
  app.addHook("onRequest", async (request: FastifyRequest, reply: FastifyReply) => {
    // Skip auth for public routes
    if (
      request.url === "/api/health" ||
      request.url === "/api/health/ready" ||
      request.url.startsWith("/api/auth") ||
      request.url.startsWith("/admin")
    ) {
      return;
    }

    const authHeader = request.headers.authorization;
    if (!authHeader) {
      if (process.env.NODE_ENV === "development") return;
      return reply.code(401).send({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Missing authentication" },
      });
    }

    const [type, token] = authHeader.split(" ");
    
    // Handle JWT (Dashboard)
    if (type === "Bearer" && token && token.split(".").length === 3) {
      try {
        await request.jwtVerify();
        const userId = (request.user as any).sub;
        
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, plan: true }
        });

        if (user) {
          request.apiKey = {
            id: "jwt_session",
            userId: user.id,
            userPlan: user.plan,
          };
          return;
        }
      } catch (err) {
        // Fallback to API Key check if JWT fails
      }
    }

    // Handle API Key (SDK/CLI)
    if (type === "Bearer" && token) {
      const hashed = hashApiKey(token);

      try {
        const apiKey = await prisma.apiKey.findUnique({
          where: { hashedKey: hashed },
          include: { user: { select: { id: true, plan: true } } },
        });

        if (!apiKey || apiKey.revoked) {
          return reply.code(401).send({
            success: false,
            error: { code: "UNAUTHORIZED", message: "Invalid or revoked API key" },
          });
        }

        if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
          return reply.code(401).send({
            success: false,
            error: { code: "KEY_EXPIRED", message: "API key has expired" },
          });
        }

        request.apiKey = {
          id: apiKey.id,
          userId: apiKey.user.id,
          userPlan: apiKey.user.plan,
        };

        prisma.apiKey
          .update({
            where: { id: apiKey.id },
            data: { lastUsedAt: new Date() },
          })
          .catch(() => {});
      } catch (err) {
        app.log.error({ err }, "Auth lookup failed");
        return reply.code(500).send({
          success: false,
          error: { code: "INTERNAL_ERROR", message: "Authentication service error" },
        });
      }
    } else {
      return reply.code(401).send({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Invalid token type" },
      });
    }
  });
}
