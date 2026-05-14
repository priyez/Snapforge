# Architecture

> System design and codebase overview for the Screenshot API platform.

---

## High-Level Overview

The Screenshot API is a **TypeScript monorepo** built with pnpm workspaces and Turborepo. It follows a producer/consumer architecture where the API server enqueues jobs and the worker processes them asynchronously.

```
┌──────────────────┐     ┌──────────────┐     ┌──────────────────┐
│                  │     │              │     │                  │
│   Dashboard      │────▶│   API Server │◀────│   SDK / cURL     │
│   (React + Vite) │     │   (Fastify)  │     │   (Clients)      │
│   :3300          │     │   :3000      │     │                  │
│                  │     │              │     │                  │
└──────────────────┘     └──────┬───────┘     └──────────────────┘
                               │
                    ┌──────────┼──────────┐
                    │          │          │
               ┌────▼────┐ ┌──▼───┐ ┌────▼─────┐
               │         │ │      │ │          │
               │  Redis  │ │ BullMQ│ │ Postgres │
               │  Cache  │ │ Queue│ │ (Prisma) │
               │         │ │      │ │          │
               └────┬────┘ └──┬───┘ └──────────┘
                    │         │
                    │    ┌────▼─────────────┐
                    │    │                  │
                    └───▶│   Worker         │
                         │   (Puppeteer)    │
                         │                  │
                         └────┬─────────────┘
                              │
                    ┌─────────▼──────────┐
                    │                    │
                    │   Storage          │
                    │   (Local / R2 / S3)│
                    │                    │
                    └────────────────────┘
```

---

## Request Flow

### Synchronous Screenshot

```
Client ──▶ API Server ──▶ BullMQ Queue ──▶ Worker (Puppeteer)
                                                   │
Client ◀── API Server ◀── QueueEvents ◀────────────┘
              (waits)        (result)        (screenshot + upload)
```

1. Client sends `GET /api/screenshot?url=...` with API key
2. API validates the URL (SSRF check), parameters, and quota
3. API checks Redis cache — if hit, returns cached result immediately
4. API enqueues a BullMQ job and waits for completion via `QueueEvents`
5. Worker picks up the job, launches Puppeteer, captures the screenshot
6. Worker uploads to storage (local disk or R2) and returns the result
7. API returns the screenshot URL to the client

### Direct Mode (Development Bypass)

```
Client ──▶ API Server (Puppeteer) ──▶ Storage
```

For rapid local development, the platform supports **Direct Mode** via `DIRECT_SCREENSHOT=true`. In this mode:
1. The API server skips enqueuing a BullMQ job.
2. It launches its own one-off Puppeteer instance immediately.
3. It captures the screenshot and uploads it to storage directly.
4. It records the job in the database and returns the result.

This removes the dependency on a running Worker process and Redis queue during initial UI/logic development.

### Asynchronous Screenshot

```
Client ──▶ API Server ──▶ BullMQ Queue ──▶ Worker (Puppeteer)
                │                                   │
Client ◀────────┘                                   │
  (jobId)                                           │
                                                    │
Client ──▶ API Server ──▶ GET /api/screenshot/:jobId│
Client ◀── API Server ◀── Job Status ◀─────────────┘
```

1. Client sends `POST /api/screenshot` with `async: true`
2. API enqueues the job and immediately returns a `jobId`
3. Client polls `GET /api/screenshot/:jobId` for status
4. Worker processes in the background and updates job state
5. Optionally, worker sends a webhook notification on completion

---

## Monorepo Structure

```
screenshot-api/
├── apps/
│   ├── api/              # Fastify REST API server
│   │   └── src/
│   │       ├── config/       # Environment configuration (Zod-validated)
│   │       ├── middleware/   # Error handler
│   │       ├── plugins/      # Fastify plugins (Redis, Auth, Rate Limit, Quota)
│   │       ├── routes/       # Route handlers
│   │       │   ├── auth.ts       # Register, Login, Me, Settings
│   │       │   ├── oauth.ts      # Google & GitHub OAuth handlers
│   │       │   ├── health.ts     # Health + Readiness checks
│   │       │   ├── keys.ts       # API key CRUD
│   │       │   ├── schedules.ts  # Cron schedule management
│   │       │   ├── screenshot.ts # Core screenshot endpoints
│   │       │   └── webhooks.ts   # Webhook management
│   │       ├── app.ts        # Fastify app builder
│   │       └── index.ts      # Entry point
│   │
│   ├── worker/           # Screenshot processing worker
│   │   └── src/
│   │       ├── browser/      # Puppeteer browser pool (generic-pool)
│   │       ├── config/       # Worker environment config
│   │       ├── lib/          # Utilities (diff, ad-blocking)
│   │       ├── storage/      # Storage adapters (Local, R2)
│   │       ├── processor.ts  # BullMQ job processor
│   │       └── index.ts      # Entry point
│   │
│   └── dashboard/        # React management dashboard
│       └── src/
│           ├── components/   # UI components
│           ├── lib/          # API client, utilities
│           ├── routes/       # TanStack Router file-based routes
│           │   ├── index.tsx         # Landing Page (Public)
│           │   ├── login.tsx         # Login page (OAuth + Credentials)
│           │   ├── register.tsx      # Registration page
│           │   ├── dashboard.tsx     # Dashboard Layout (Authenticated)
│           │   └── dashboard/        # Authenticated dashboard routes
│           └── styles.css    # Global styles
│
├── packages/
│   ├── shared/           # Shared constants, types, URL validator
│   ├── queue/            # BullMQ queue definitions
│   ├── db/               # Prisma schema, client, seed
│   ├── sdk/              # Public TypeScript SDK
│   └── tsconfig/         # Shared TypeScript configurations
│
├── scripts/              # Test scripts (rate limit, SDK tests)
├── docker-compose.yml    # PostgreSQL + Redis containers
├── turbo.json            # Turborepo pipeline configuration
├── pnpm-workspace.yaml   # Workspace definitions
└── .env.example          # Environment template
```

---

## Technology Stack

### API Server (`apps/api`)

| Technology         | Purpose                          |
|--------------------|----------------------------------|
| **Fastify**        | HTTP framework (high-performance)|
| **Zod**            | Request validation               |
| **BullMQ**         | Job queue producer               |
| **ioredis**        | Redis client (cache + queue)     |
| **@fastify/jwt**   | JWT authentication               |
| **@fastify/cors**  | CORS handling                    |
| **@fastify/rate-limit** | Rate limiting              |
| **bcrypt**         | Password hashing                 |

### Worker (`apps/worker`)

| Technology                | Purpose                       |
|---------------------------|-------------------------------|
| **Puppeteer**             | Headless Chrome automation    |
| **puppeteer-extra**       | Plugin system for stealth     |
| **BullMQ**                | Job queue consumer            |
| **generic-pool**          | Browser instance pool         |
| **pixelmatch / pngjs**    | Visual diff comparison        |
| **@aws-sdk/client-s3**    | R2/S3 storage uploads         |

### Dashboard (`apps/dashboard`)

| Technology               | Purpose                        |
|--------------------------|--------------------------------|
| **React 19**             | UI framework                   |
| **Vite 8**               | Build tool / dev server        |
| **TanStack Router**      | File-based routing             |
| **TanStack Query**       | Data fetching / caching        |
| **Tailwind CSS 4**       | Styling                        |
| **Recharts**             | Data visualization             |
| **Motion (Framer)**      | Animations                     |
| **Lucide React**         | Icons                          |

### Shared Packages

| Package              | Purpose                                       |
|----------------------|-----------------------------------------------|
| `@screenshot-api/shared` | Constants, types, URL validator, cache keys|
| `@screenshot-api/queue`  | BullMQ queue name definitions              |
| `@screenshot-api/db`     | Prisma schema, client, migrations          |
| `@screenshot-api/sdk`    | Public TypeScript SDK for consumers        |
| `@screenshot-api/tsconfig` | Shared TypeScript base configurations    |

---

## Database Schema

The database uses **PostgreSQL** with **Prisma ORM**. Key models:

```
┌─────────────┐       ┌──────────────┐
│    User      │──────▶│   ApiKey     │
│              │       │              │
│  id          │       │  hashedKey   │
│  email       │       │  prefix      │
│  plan        │       │  revoked     │
│  password    │       └──────────────┘
│  alertConfig │
└──────┬───┬──┬┘
       │   │  │       ┌──────────────────┐
       │   │  └──────▶│  ScreenshotJob   │
       │   │          │                  │
       │   │          │  url             │
       │   │          │  status          │
       │   │          │  imageUrl        │
       │   │          │  diffPercentage  │
       │   │          └──────────────────┘
       │   │
       │   │          ┌──────────────┐
       │   └─────────▶│  Schedule    │
       │              │              │
       │              │  cron        │
       │              │  url         │
       │              │  active      │
       │              └──────────────┘
       │
       │              ┌──────────────┐     ┌──────────────┐
       └─────────────▶│  Webhook     │────▶│  WebhookLog  │
                      │              │     │              │
                      │  url         │     │  statusCode  │
                      │  events      │     │  success     │
                      │  secret      │     │  durationMs  │
                      └──────────────┘     └──────────────┘
```

### Plans & Quotas

| Plan         | Daily Quota | Features                     |
|--------------|-------------|------------------------------|
| `FREE`       | Limited     | Basic screenshots            |
| `PRO`        | Higher      | Schedules, webhooks, diffs   |
| `ENTERPRISE` | Unlimited   | Custom limits, SLA           |

---

## Caching Strategy

- **Cache layer:** Redis
- **Cache key:** Generated from URL + all screenshot options (deterministic hash)
- **Deduplication:** Jobs with the same cache key are deduplicated in BullMQ
- **Cache hits:** Return immediately without enqueuing a new job

---

## Security

### SSRF Protection

All user-provided URLs are validated before processing:

- Private IP ranges are blocked (10.x, 172.16-31.x, 192.168.x, 127.x, etc.)
- Localhost and internal hostnames are rejected
- Webhook URLs go through the same validation

### Authentication

- **API keys:** SHA-256 hashed before storage — raw keys are never persisted
- **Passwords:** bcrypt-hashed with salt rounds of 10
- **OAuth:** Google and GitHub OAuth 2.0 integration with account linking
- **JWT:** Signed tokens for dashboard sessions

### Rate Limiting

Per-key rate limiting via `@fastify/rate-limit` with Redis backing for distributed enforcement.

---

## Worker Architecture

The worker uses a **browser pool** pattern for efficiency:

```
┌──────────────────────────────────────────┐
│  Browser Pool (generic-pool)             │
│                                          │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  │
│  │Browser 1│  │Browser 2│  │Browser 3│  │
│  │ (pages) │  │ (pages) │  │ (pages) │  │
│  └─────────┘  └─────────┘  └─────────┘  │
│                                          │
│  min: 1, max: WORKER_CONCURRENCY        │
│  maxPagesPerBrowser: MAX_BROWSER_PAGES   │
└──────────────────────────────────────────┘
```

- Browsers are pooled and reused across jobs
- Each browser can open multiple pages (tabs)
- Pool stats are logged every 60 seconds
- Graceful shutdown drains the pool before exiting

### Storage Adapters

| Adapter   | Config                 | Use Case              |
|-----------|------------------------|-----------------------|
| `local`   | `STORAGE_PATH`         | Local development     |
| `r2`      | `R2_*` env vars        | Production (Cloudflare R2) |

Both implement a common `StorageAdapter` interface for interchangeable backends.
