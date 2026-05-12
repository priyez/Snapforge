import type { FastifyInstance, FastifyError } from "fastify";

export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error: FastifyError, request, reply) => {
    // Log the error
    request.log.error({ err: error }, "Request error");

    // Handle validation errors
    if (error.validation) {
      return reply.code(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request parameters",
          details: error.validation,
        },
      });
    }

    // Handle rate limit errors
    if (error.statusCode === 429) {
      return reply.code(429).send({
        success: false,
        error: {
          code: "RATE_LIMITED",
          message: "Too many requests. Please slow down.",
        },
      });
    }

    // Handle known HTTP errors
    if (error.statusCode && error.statusCode < 500) {
      return reply.code(error.statusCode).send({
        success: false,
        error: {
          code: error.code || "CLIENT_ERROR",
          message: error.message,
        },
      });
    }

    // Internal server errors — hide details in production
    const message =
      process.env.NODE_ENV === "production"
        ? "An internal server error occurred"
        : error.message;

    return reply.code(500).send({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message,
      },
    });
  });
}
