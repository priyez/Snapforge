/**
 * Custom error classes for the Screenshot API SDK.
 */

export class ScreenshotAPIError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(message: string, code: string, statusCode: number) {
    super(message);
    this.name = "ScreenshotAPIError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class AuthenticationError extends ScreenshotAPIError {
  constructor(message = "Invalid or missing API key") {
    super(message, "UNAUTHORIZED", 401);
    this.name = "AuthenticationError";
  }
}

export class RateLimitError extends ScreenshotAPIError {
  public readonly retryAfter?: number;

  constructor(message = "Rate limit exceeded", retryAfter?: number) {
    super(message, "RATE_LIMITED", 429);
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}

export class ValidationError extends ScreenshotAPIError {
  constructor(message = "Invalid request parameters") {
    super(message, "VALIDATION_ERROR", 400);
    this.name = "ValidationError";
  }
}

export class TimeoutError extends ScreenshotAPIError {
  constructor(message = "Request timed out") {
    super(message, "TIMEOUT", 504);
    this.name = "TimeoutError";
  }
}

export class NotFoundError extends ScreenshotAPIError {
  constructor(message = "Resource not found") {
    super(message, "NOT_FOUND", 404);
    this.name = "NotFoundError";
  }
}
