import type { FastifyInstance } from "fastify";

export async function registerHealthRoutes(app: FastifyInstance) {
  app.get("/api/health", async (_request, reply) => {
    return reply.send({
      success: true,
      data: {
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
    });
  });

  app.get("/api/health/ready", async (_request, reply) => {
    try {
      // Check Redis connectivity
      await app.redis.ping();

      return reply.send({
        success: true,
        data: {
          status: "ready",
          redis: "connected",
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err) {
      return reply.code(503).send({
        success: false,
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "One or more dependencies are not ready",
        },
      });
    }
  });
}
