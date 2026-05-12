import type {
  ScreenshotAPIConfig,
  ScreenshotOptions,
  ScreenshotResult,
  AsyncJobResult,
  JobStatusResult,
  ApiResponse,
} from "./types.js";
import {
  ScreenshotAPIError,
  AuthenticationError,
  RateLimitError,
  ValidationError,
  TimeoutError,
  NotFoundError,
} from "./errors.js";

const DEFAULT_BASE_URL = "http://localhost:3000";
const DEFAULT_TIMEOUT = 60000;
const DEFAULT_RETRIES = 2;

/**
 * Screenshot API SDK Client.
 *
 * @example
 * ```typescript
 * const client = new ScreenshotAPI({ apiKey: 'sfg_live_xxx' });
 *
 * // Synchronous screenshot
 * const result = await client.screenshot({ url: 'https://example.com' });
 * console.log(result.imageUrl);
 *
 * // Async screenshot
 * const job = await client.screenshotAsync({ url: 'https://example.com' });
 * const completed = await client.waitForJob(job.jobId);
 * console.log(completed.imageUrl);
 * ```
 */
export class ScreenshotAPI {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly retries: number;

  constructor(config: ScreenshotAPIConfig) {
    if (!config.apiKey) {
      throw new AuthenticationError("API key is required");
    }

    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, "");
    this.timeout = config.timeout || DEFAULT_TIMEOUT;
    this.retries = config.retries ?? DEFAULT_RETRIES;
  }

  /**
   * Take a screenshot synchronously.
   * Waits for the screenshot to complete and returns the result.
   */
  async screenshot(options: ScreenshotOptions): Promise<ScreenshotResult> {
    const response = await this.request<ScreenshotResult>("POST", "/api/screenshot", {
      ...options,
      async: false,
    });

    return response;
  }

  /**
   * Take a screenshot asynchronously.
   * Returns a job ID immediately. Use `waitForJob()` or `getJobStatus()` to get the result.
   */
  async screenshotAsync(options: ScreenshotOptions): Promise<AsyncJobResult> {
    const response = await this.request<AsyncJobResult>("POST", "/api/screenshot", {
      ...options,
      async: true,
    });

    return response;
  }

  /**
   * Get the status of an async screenshot job.
   */
  async getJobStatus(jobId: string): Promise<JobStatusResult> {
    return this.request<JobStatusResult>("GET", `/api/screenshot/${jobId}`);
  }

  /**
   * Wait for an async job to complete.
   * Polls the job status at the specified interval.
   */
  async waitForJob(
    jobId: string,
    options: { pollInterval?: number; maxWait?: number } = {}
  ): Promise<JobStatusResult> {
    const pollInterval = options.pollInterval || 2000;
    const maxWait = options.maxWait || this.timeout;
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
      const status = await this.getJobStatus(jobId);

      if (status.status === "completed" || status.status === "failed") {
        return status;
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new TimeoutError(`Job ${jobId} did not complete within ${maxWait}ms`);
  }

  /**
   * Download a screenshot as a Buffer.
   */
  async downloadScreenshot(imageUrl: string): Promise<ArrayBuffer> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(imageUrl, { signal: controller.signal });

      if (!response.ok) {
        throw new ScreenshotAPIError(
          `Failed to download screenshot: ${response.statusText}`,
          "DOWNLOAD_ERROR",
          response.status
        );
      }

      return response.arrayBuffer();
    } finally {
      clearTimeout(timeout);
    }
  }

  // ── Private Methods ─────────────────────────────────────────

  private async request<T>(method: string, path: string, body?: Record<string, unknown>): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        return await this.executeRequest<T>(method, path, body);
      } catch (err) {
        lastError = err as Error;

        // Don't retry auth errors or validation errors
        if (err instanceof AuthenticationError || err instanceof ValidationError) {
          throw err;
        }

        // Don't retry if we've exhausted attempts
        if (attempt === this.retries) {
          throw err;
        }

        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError || new Error("Request failed");
  }

  private async executeRequest<T>(
    method: string,
    path: string,
    body?: Record<string, unknown>
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeout);

    try {
      const options: RequestInit = {
        method,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        signal: controller.signal,
      };

      if (body && method !== "GET") {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);

      // Handle error status codes
      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as ApiResponse<never> | null;
        const message = errorBody?.error?.message || response.statusText;
        const code = errorBody?.error?.code || "UNKNOWN_ERROR";

        switch (response.status) {
          case 401:
            throw new AuthenticationError(message);
          case 429: {
            const retryAfter = response.headers.get("retry-after");
            throw new RateLimitError(message, retryAfter ? parseInt(retryAfter) : undefined);
          }
          case 400:
            throw new ValidationError(message);
          case 404:
            throw new NotFoundError(message);
          case 504:
            throw new TimeoutError(message);
          default:
            throw new ScreenshotAPIError(message, code, response.status);
        }
      }

      const json = (await response.json()) as ApiResponse<T>;

      if (!json.success || !json.data) {
        throw new ScreenshotAPIError(
          json.error?.message || "Unknown error",
          json.error?.code || "UNKNOWN_ERROR",
          500
        );
      }

      return json.data;
    } catch (err) {
      if (err instanceof ScreenshotAPIError) throw err;

      if ((err as Error).name === "AbortError") {
        throw new TimeoutError(`Request to ${path} timed out after ${this.timeout}ms`);
      }

      throw new ScreenshotAPIError(
        (err as Error).message || "Network error",
        "NETWORK_ERROR",
        0
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}
