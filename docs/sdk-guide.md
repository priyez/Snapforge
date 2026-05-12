# SDK Guide

> Integrate the Screenshot API into your TypeScript/JavaScript projects using the official SDK.

---

## Installation

```bash
npm install @screenshot-api/sdk
# or
pnpm add @screenshot-api/sdk
# or
yarn add @screenshot-api/sdk
```

---

## Quick Start

```typescript
import { ScreenshotAPI } from "@screenshot-api/sdk";

const client = new ScreenshotAPI({
  apiKey: process.env.SCREENSHOT_API_KEY!,
});

// Take a screenshot
const result = await client.screenshot({
  url: "https://example.com",
});

console.log(result.imageUrl);
```

---

## Configuration

```typescript
const client = new ScreenshotAPI({
  // Required — Your API key (starts with sfg_live_)
  apiKey: "sfg_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",

  // Optional — API server URL (default: http://localhost:3000)
  baseUrl: "https://api.your-domain.com",

  // Optional — Request timeout in ms (default: 60000)
  timeout: 30000,

  // Optional — Retry attempts for failed requests (default: 2)
  retries: 3,
});
```

| Option    | Type   | Default                  | Description                |
|-----------|--------|--------------------------|----------------------------|
| `apiKey`  | string | required                 | Your API key               |
| `baseUrl` | string | `http://localhost:3000`   | API server URL             |
| `timeout` | number | `60000`                  | Request timeout (ms)       |
| `retries` | number | `2`                      | Retry attempts             |

---

## Synchronous Screenshots

The simplest way to take a screenshot. The method waits for the screenshot to be generated and returns the result.

```typescript
const result = await client.screenshot({
  url: "https://github.com",
  width: 1440,
  height: 900,
  fullPage: false,
  format: "png",
});

console.log(result.imageUrl);     // URL to the screenshot
console.log(result.renderTimeMs); // Time taken in ms
console.log(result.cached);       // Whether it was served from cache
```

### All Screenshot Options

```typescript
const result = await client.screenshot({
  // Target URL (required)
  url: "https://example.com",

  // Viewport dimensions
  width: 1440,        // Default: 1440
  height: 900,        // Default: 900

  // Capture options
  fullPage: true,     // Capture full scrollable page
  format: "webp",     // "png" | "jpeg" | "webp"
  quality: 90,        // 1-100 (JPEG/WebP only)
  delay: 2000,        // Wait 2s before capture

  // Element targeting
  selector: "#main",  // Capture specific CSS element

  // Browser emulation
  darkMode: true,     // Emulate dark mode
  deviceName: "iphone-15-pro",  // Use device preset
  blockAds: true,     // Block ads and trackers

  // Code injection
  customCss: "body { background: red; }",
  customJs: "document.querySelector('.modal')?.remove()",

  // Webhook notification
  webhookUrl: "https://your-server.com/hook",
});
```

---

## Asynchronous Screenshots

For long-running screenshots, use async mode. The API returns a job ID immediately, and you can poll for the result.

```typescript
// Submit the job
const job = await client.screenshotAsync({
  url: "https://example.com",
  fullPage: true,
});

console.log(job.jobId);    // "abc123"
console.log(job.status);   // "queued"
console.log(job.statusUrl); // "/api/screenshot/abc123"

// Wait for completion (polls automatically)
const completed = await client.waitForJob(job.jobId, {
  pollInterval: 2000,  // Check every 2 seconds (default)
  maxWait: 60000,      // Max wait time in ms (default: timeout)
});

if (completed.status === "completed") {
  console.log(completed.imageUrl);
} else {
  console.error("Job failed:", completed.error);
}
```

### Manual Status Polling

```typescript
// Check job status manually
const status = await client.getJobStatus(job.jobId);

switch (status.status) {
  case "queued":
    console.log("Waiting in queue...");
    break;
  case "processing":
    console.log("Screenshot being captured...");
    break;
  case "completed":
    console.log("Done!", status.imageUrl);
    break;
  case "failed":
    console.error("Failed:", status.error);
    break;
}
```

---

## Download Screenshots

Download a screenshot as a binary buffer:

```typescript
const result = await client.screenshot({
  url: "https://example.com",
});

// Download as ArrayBuffer
const buffer = await client.downloadScreenshot(result.imageUrl);

// Save to file (Node.js)
import { writeFile } from "fs/promises";
await writeFile("screenshot.png", Buffer.from(buffer));
```

---

## Error Handling

The SDK throws specific error types for different failure scenarios:

```typescript
import {
  ScreenshotAPI,
  AuthenticationError,
  RateLimitError,
  ValidationError,
  TimeoutError,
  NotFoundError,
  ScreenshotAPIError,
} from "@screenshot-api/sdk";

try {
  const result = await client.screenshot({
    url: "https://example.com",
  });
} catch (err) {
  if (err instanceof AuthenticationError) {
    // Invalid or missing API key
    console.error("Auth failed:", err.message);
  } else if (err instanceof RateLimitError) {
    // Too many requests — wait and retry
    console.error(`Rate limited. Retry after ${err.retryAfter}s`);
  } else if (err instanceof ValidationError) {
    // Invalid parameters
    console.error("Invalid params:", err.message);
  } else if (err instanceof TimeoutError) {
    // Screenshot took too long
    console.error("Timed out:", err.message);
  } else if (err instanceof NotFoundError) {
    // Job or resource not found
    console.error("Not found:", err.message);
  } else if (err instanceof ScreenshotAPIError) {
    // Generic API error
    console.error(`Error [${err.code}]: ${err.message}`);
  }
}
```

### Error Types

| Error Class          | Trigger                      | HTTP Status |
|----------------------|------------------------------|-------------|
| `AuthenticationError`| Invalid/missing API key      | 401         |
| `RateLimitError`     | Too many requests            | 429         |
| `ValidationError`    | Invalid parameters           | 400         |
| `TimeoutError`       | Screenshot/request timed out | 504         |
| `NotFoundError`      | Resource not found           | 404         |
| `ScreenshotAPIError` | Any other API error          | Varies      |

---

## Retry Behavior

The SDK automatically retries failed requests with exponential backoff:

- **Default retries:** 2 (configurable via `retries` option)
- **Backoff:** 1s, 2s, 4s, ... (exponential)
- **Non-retryable:** `AuthenticationError` and `ValidationError` are never retried

---

## TypeScript Types

All types are fully exported:

```typescript
import type {
  ScreenshotAPIConfig,
  ScreenshotOptions,
  ScreenshotResult,
  AsyncJobResult,
  JobStatusResult,
  ApiResponse,
} from "@screenshot-api/sdk";
```

### `ScreenshotResult`

```typescript
interface ScreenshotResult {
  imageUrl: string;      // URL to the generated screenshot
  format: string;        // Image format (png, jpeg, webp)
  width: number;         // Actual image width
  height: number;        // Actual image height
  renderTimeMs: number;  // Time to render in milliseconds
  cached: boolean;       // Whether result was from cache
  expiresAt: string;     // Cache expiration timestamp
}
```

### `AsyncJobResult`

```typescript
interface AsyncJobResult {
  jobId: string;                                        // Unique job identifier
  status: "queued" | "processing" | "completed" | "failed";
  statusUrl: string;                                    // Polling URL
}
```

### `JobStatusResult`

```typescript
interface JobStatusResult {
  jobId: string;
  status: "queued" | "processing" | "completed" | "failed";
  imageUrl?: string;
  format?: string;
  width?: number;
  height?: number;
  renderTimeMs?: number;
  cached?: boolean;
  error?: string;        // Error message if status is "failed"
}
```
