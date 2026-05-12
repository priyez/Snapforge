import type { FastifyInstance } from "fastify";
import { z } from "zod";
import bcrypt from "bcrypt";
import { prisma } from "@screenshot-api/db";

export async function registerAuthRoutes(app: FastifyInstance) {
  /* 
  // ── POST /api/auth/register ──────────────────────────────────
  app.post("/api/auth/register", async (request, reply) => {
    const bodySchema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().optional(),
    });

    const parseResult = bodySchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.code(400).send({
        success: false,
        error: { code: "VALIDATION_ERROR", details: parseResult.error.flatten().fieldErrors },
      });
    }

    const { email, password, name } = parseResult.data;

    try {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return reply.code(409).send({
          success: false,
          error: { code: "EMAIL_EXISTS", message: "Email already in use" },
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
        },
      });

      const token = app.jwt.sign({ sub: user.id, email: user.email });

      return reply.code(201).send({
        success: true,
        data: { token, user: { id: user.id, email: user.email, name: user.name } },
      });
    } catch (err) {
      return reply.code(500).send({ success: false, error: { code: "INTERNAL_ERROR" } });
    }
  });

  // ── POST /api/auth/login ─────────────────────────────────────
  app.post("/api/auth/login", async (request, reply) => {
    const bodySchema = z.object({
      email: z.string().email(),
      password: z.string(),
    });

    const parseResult = bodySchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.code(400).send({ success: false, error: { code: "VALIDATION_ERROR" } });
    }

    const { email, password } = parseResult.data;

    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !user.password) {
        return reply.code(401).send({
          success: false,
          error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" },
        });
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return reply.code(401).send({
          success: false,
          error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" },
        });
      }

      const token = app.jwt.sign({ sub: user.id, email: user.email });

      return reply.send({
        success: true,
        data: { token, user: { id: user.id, email: user.email, name: user.name } },
      });
    } catch (err) {
      return reply.code(500).send({ success: false, error: { code: "INTERNAL_ERROR" } });
    }
  });
  */

  // ── GET /api/auth/me ─────────────────────────────────────────
  app.get("/api/auth/me", async (request, reply) => {
    try {
      await request.jwtVerify();
      const user = await prisma.user.findUnique({ 
        where: { id: (request.user as any).sub } 
      });
      
      if (!user) {
        return reply.code(404).send({ success: false, error: { code: "USER_NOT_FOUND" } });
      }

      return reply.send({
        success: true,
        data: { 
          id: user.id, 
          email: user.email, 
          name: user.name, 
          plan: user.plan,
          avatarUrl: user.avatarUrl,
          emailAlerts: (user as any).emailAlerts,
          alertThreshold: (user as any).alertThreshold,
          slackWebhook: (user as any).slackWebhook,
          discordWebhook: (user as any).discordWebhook,
          telegramChatId: (user as any).telegramChatId,
        },
      });
    } catch (err) {
      return reply.code(401).send({ success: false, error: { code: "UNAUTHORIZED" } });
    }
  });

  // ── PATCH /api/auth/settings ───────────────────────────────────
  app.patch("/api/auth/settings", async (request, reply) => {
    try {
      await request.jwtVerify();
      const userId = (request.user as any).sub;

      const schema = z.object({
        name: z.string().optional(),
        email: z.string().email().optional(),
        emailAlerts: z.boolean().optional(),
        alertThreshold: z.number().optional(),
        slackWebhook: z.string().url().nullable().optional(),
        discordWebhook: z.string().url().nullable().optional(),
        telegramChatId: z.string().nullable().optional(),
      });

      const data = schema.parse(request.body);

      const updated = await prisma.user.update({
        where: { id: userId },
        data,
      });

      return reply.send({
        success: true,
        data: updated,
      });
    } catch (err) {
      return reply.code(401).send({ success: false, error: { code: "UNAUTHORIZED" } });
    }
  });
}
