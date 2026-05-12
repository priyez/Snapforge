# API Reference

> Complete reference for all Screenshot API endpoints.

**Base URL:** `http://localhost:3000` (development)

All responses follow a consistent format:

```json
{
  "success": true,
  "data": { ... }
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description"
  }
}
```

---

## Authentication

The API supports two authentication methods:

### API Key (Header)

```
Authorization: Bearer sfg_live_xxxxxxxxxxxxxxxx
```

### JWT Token (Dashboard)

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

Obtain JWT tokens via the `/api/auth/login` or `/api/auth/register` endpoints.

---

## Health

### `GET /api/health`

Basic health check. No authentication required.

**Response:**

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2026-05-11T12:00:00.000Z",
    "uptime": 42.5
  }
}
```

---

### `GET /api/health/ready`

Readiness check including dependency status (Redis). No authentication required.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "status": "ready",
    "redis": "connected",
    "timestamp": "2026-05-11T12:00:00.000Z"
  }
}
```

**Response (503):** Service unavailable if Redis is not reachable.

---

## Screenshots

### `GET /api/screenshot`

Take a screenshot synchronously. Waits for the screenshot to be generated and returns the result.

**Authentication:** Required (API key)

**Query Parameters:**

| Parameter    | Type    | Default  | Description                              |
|-------------|---------|----------|------------------------------------------|
| `url`        | string  | required | Target URL to capture                    |
| `width`      | number  | `1440`   | Viewport width in pixels                 |
| `height`     | number  | `900`    | Viewport height in pixels                |
| `fullPage`   | boolean | `false`  | Capture full scrollable page             |
| `format`     | string  | `"png"`  | Output format: `png`, `jpeg`, `webp`     |
| `quality`    | number  | `80`     | JPEG/WebP quality (1–100)                |
| `delay`      | number  | `0`      | Delay before capture in milliseconds     |
| `selector`   | string  | —        | CSS selector to capture specific element |
| `darkMode`   | boolean | `false`  | Emulate dark color scheme                |
| `deviceName` | string  | —        | Device preset name                       |
| `blockAds`   | boolean | `false`  | Block ads and trackers                   |

**Example:**

```bash
curl "http://localhost:3000/api/screenshot?url=https://example.com&width=1280&format=webp" \
  -H "Authorization: Bearer sfg_live_xxx"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "imageUrl": "http://localhost:3000/screenshots/abc123.png",
    "format": "png",
    "width": 1440,
    "height": 900,
    "renderTimeMs": 2340,
    "cached": false,
    "expiresAt": "2026-05-12T12:00:00.000Z"
  }
}
```

**Response (504):** Timeout — screenshot took too long.

---

### `POST /api/screenshot`

Take a screenshot with full options. Supports both synchronous and asynchronous modes.

**Authentication:** Required (API key)

**Request Body:**

| Parameter    | Type    | Default  | Description                              |
|-------------|---------|----------|------------------------------------------|
| `url`        | string  | required | Target URL to capture                    |
| `width`      | number  | `1440`   | Viewport width in pixels                 |
| `height`     | number  | `900`    | Viewport height in pixels                |
| `fullPage`   | boolean | `false`  | Capture full scrollable page             |
| `format`     | string  | `"png"`  | Output format: `png`, `jpeg`, `webp`     |
| `quality`    | number  | —        | JPEG/WebP quality (1–100)                |
| `delay`      | number  | —        | Delay before capture in milliseconds     |
| `selector`   | string  | —        | CSS selector to capture specific element |
| `darkMode`   | boolean | —        | Emulate dark color scheme                |
| `deviceName` | string  | —        | Device preset name                       |
| `blockAds`   | boolean | —        | Block ads and trackers                   |
| `customCss`  | string  | —        | Custom CSS to inject before capture      |
| `customJs`   | string  | —        | Custom JS to execute before capture      |
| `async`      | boolean | `false`  | Return job ID immediately                |
| `webhookUrl` | string  | —        | Webhook URL for completion notification  |

**Example (Synchronous):**

```bash
curl -X POST http://localhost:3000/api/screenshot \
  -H "Authorization: Bearer sfg_live_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "width": 1440,
    "fullPage": true,
    "format": "webp",
    "quality": 90
  }'
```

**Example (Asynchronous):**

```bash
curl -X POST http://localhost:3000/api/screenshot \
  -H "Authorization: Bearer sfg_live_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "async": true,
    "webhookUrl": "https://your-server.com/webhook"
  }'
```

**Response (202 — Async mode):**

```json
{
  "success": true,
  "data": {
    "jobId": "abc123",
    "status": "queued",
    "statusUrl": "/api/screenshot/abc123"
  }
}
```

---

### `GET /api/screenshot/:jobId`

Check the status of an async screenshot job.

**Authentication:** Required (API key)

**Response (200 — Completed):**

```json
{
  "success": true,
  "data": {
    "jobId": "abc123",
    "status": "completed",
    "imageUrl": "http://localhost:3000/screenshots/abc123.png",
    "format": "png",
    "width": 1440,
    "height": 900,
    "renderTimeMs": 2340,
    "cached": false
  }
}
```

**Response (200 — Processing):**

```json
{
  "success": true,
  "data": {
    "jobId": "abc123",
    "status": "processing"
  }
}
```

**Response (200 — Failed):**

```json
{
  "success": true,
  "data": {
    "jobId": "abc123",
    "status": "failed",
    "error": "Navigation timeout of 30000ms exceeded"
  }
}
```

---

### `GET /api/screenshot/history`

List recent screenshot jobs for the authenticated user.

**Authentication:** Required (API key)

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "clxxx...",
      "url": "https://example.com",
      "status": "COMPLETED",
      "imageUrl": "...",
      "renderTimeMs": 2340,
      "cacheHit": false,
      "createdAt": "2026-05-11T12:00:00.000Z",
      "completedAt": "2026-05-11T12:00:02.340Z"
    }
  ]
}
```

---

## Schedules

### `GET /api/screenshot/schedules`

List all screenshot schedules.

**Authentication:** Required (API key)

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "clxxx...",
      "name": "Homepage Monitor",
      "url": "https://example.com",
      "cron": "0 0 * * *",
      "active": true,
      "lastRunAt": "2026-05-11T00:00:00.000Z",
      "createdAt": "2026-05-01T12:00:00.000Z"
    }
  ]
}
```

---

### `POST /api/screenshot/schedules`

Create a new screenshot schedule.

**Authentication:** Required (API key)

**Request Body:**

| Parameter | Type   | Required | Description                               |
|-----------|--------|----------|-------------------------------------------|
| `name`    | string | Yes      | Schedule display name                     |
| `url`     | string | Yes      | Target URL to screenshot                  |
| `cron`    | string | Yes      | Cron expression (e.g. `"0 0 * * *"`)      |
| `options` | object | No       | Screenshot options (width, format, etc.)  |

**Example:**

```bash
curl -X POST http://localhost:3000/api/screenshot/schedules \
  -H "Authorization: Bearer sfg_live_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Daily Homepage Check",
    "url": "https://example.com",
    "cron": "0 9 * * *",
    "options": { "width": 1440, "fullPage": true }
  }'
```

---

### `DELETE /api/screenshot/schedules/:id`

Delete a schedule and remove the associated repeatable job.

**Authentication:** Required (API key)

---

### `GET /api/screenshot/schedules/:id/history`

Get the last 30 screenshot runs for a specific schedule.

**Authentication:** Required (API key)

---

## API Keys

### `GET /api/keys`

List all active (non-revoked) API keys for the authenticated user.

**Authentication:** Required (API key or JWT)

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "clxxx...",
      "name": "Production Key",
      "prefix": "sfg_live_abc12345",
      "lastUsedAt": "2026-05-11T12:00:00.000Z",
      "createdAt": "2026-05-01T00:00:00.000Z",
      "expiresAt": null
    }
  ]
}
```

---

### `POST /api/keys`

Create a new API key.

**Authentication:** Required (API key or JWT)

**Request Body:**

| Parameter | Type   | Default     | Description       |
|-----------|--------|-------------|-------------------|
| `name`    | string | `"Default"` | Key display name  |

**Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "clxxx...",
    "name": "My New Key",
    "key": "sfg_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "prefix": "sfg_live_abc12345",
    "createdAt": "2026-05-11T12:00:00.000Z"
  }
}
```

> **Warning:** The full `key` value is only returned once at creation time. Store it securely.

---

### `DELETE /api/keys/:id`

Revoke an API key (soft delete).

**Authentication:** Required (API key or JWT)

---

## Auth (Dashboard)

### `POST /api/auth/register`

Create a new user account.

**Request Body:**

| Parameter  | Type   | Required | Description                  |
|------------|--------|----------|------------------------------|
| `email`    | string | Yes      | User email address           |
| `password` | string | Yes      | Password (min 8 characters)  |
| `name`     | string | No       | Display name                 |

**Response (201):**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "clxxx...",
      "email": "user@example.com",
      "name": "John Doe"
    }
  }
}
```

---

### `POST /api/auth/login`

Authenticate and receive a JWT token.

**Request Body:**

| Parameter  | Type   | Required | Description        |
|------------|--------|----------|--------------------|
| `email`    | string | Yes      | User email address |
| `password` | string | Yes      | User password      |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "clxxx...",
      "email": "user@example.com",
      "name": "John Doe"
    }
  }
}
```

---

### `GET /api/auth/me`

Get the currently authenticated user's profile.

**Authentication:** Required (JWT)

---

### `PATCH /api/auth/settings`

Update user notification settings.

**Authentication:** Required (JWT)

**Request Body:**

| Parameter          | Type    | Description                           |
|--------------------|---------|---------------------------------------|
| `emailAlerts`      | boolean | Enable email alerts                   |
| `alertThreshold`   | number  | Visual diff threshold percentage      |
| `slackWebhook`     | string  | Slack webhook URL (nullable)          |
| `discordWebhook`   | string  | Discord webhook URL (nullable)        |
| `telegramChatId`   | string  | Telegram chat ID (nullable)           |

---

## Webhooks

### `GET /api/webhooks`

List all webhooks for the authenticated user.

**Authentication:** Required (API key)

---

### `POST /api/webhooks`

Create a new webhook endpoint.

**Authentication:** Required (API key)

**Request Body:**

| Parameter | Type     | Default                      | Description           |
|-----------|----------|------------------------------|-----------------------|
| `url`     | string   | required                     | Webhook endpoint URL  |
| `name`    | string   | —                            | Display name          |
| `events`  | string[] | `["screenshot.completed"]`   | Events to subscribe   |

**Available Events:**

- `screenshot.completed` — Screenshot finished successfully
- `screenshot.failed` — Screenshot generation failed
- `diff.detected` — Visual diff threshold exceeded

**Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "clxxx...",
    "url": "https://your-server.com/webhook",
    "name": "My Webhook",
    "events": ["screenshot.completed"],
    "secret": "whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "active": true,
    "createdAt": "2026-05-11T12:00:00.000Z"
  }
}
```

> **Note:** The `secret` is used to sign webhook payloads via HMAC. Verify signatures on your server to ensure authenticity.

---

### `DELETE /api/webhooks/:id`

Delete a webhook endpoint.

**Authentication:** Required (API key)

---

### `GET /api/webhooks/:id/logs`

Get the last 50 delivery logs for a webhook.

**Authentication:** Required (API key)

---

## Device Presets

The following device presets are available for the `deviceName` parameter:

| Preset             | Width  | Height | Description           |
|--------------------|--------|--------|-----------------------|
| `iphone-15-pro`    | 393    | 852    | iPhone 15 Pro         |
| `iphone-14`        | 390    | 844    | iPhone 14             |
| `iphone-se`        | 375    | 667    | iPhone SE             |
| `ipad-pro-12`      | 1024   | 1366   | iPad Pro 12.9"        |
| `ipad-air`         | 820    | 1180   | iPad Air              |
| `pixel-7`          | 412    | 915    | Google Pixel 7        |
| `samsung-s24`      | 360    | 780    | Samsung Galaxy S24    |
| `desktop-hd`       | 1920   | 1080   | Full HD Desktop       |
| `desktop-4k`       | 3840   | 2160   | 4K Desktop            |
| `macbook-pro-16`   | 1728   | 1117   | MacBook Pro 16"       |

---

## Error Codes

| Code                 | HTTP Status | Description                                |
|----------------------|-------------|--------------------------------------------|
| `VALIDATION_ERROR`   | 400         | Invalid request parameters                 |
| `INVALID_URL`        | 400         | URL is blocked or malformed (SSRF check)   |
| `INVALID_WEBHOOK_URL`| 400         | Webhook URL is blocked                     |
| `UNAUTHORIZED`       | 401         | Missing or invalid authentication          |
| `INVALID_CREDENTIALS`| 401         | Wrong email or password                    |
| `EMAIL_EXISTS`       | 409         | Email already registered                   |
| `NOT_FOUND`          | 404         | Resource not found                         |
| `RATE_LIMITED`       | 429         | Too many requests                          |
| `TIMEOUT`            | 504         | Screenshot generation timed out            |
| `INTERNAL_ERROR`     | 500         | Server error                               |

---

## Rate Limiting

The API applies rate limiting per API key. When rate-limited, the response includes a `Retry-After` header indicating how many seconds to wait before retrying.
