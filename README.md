# Screenshot API

> A production-ready Screenshot-as-a-Service platform. Generate website screenshots through a simple API.

## Architecture

```
apps/
  api/        → Fastify API server (request handling, auth, caching)
  worker/     → Screenshot worker (Puppeteer, storage, processing)
  dashboard/  → React + Vite management dashboard (Landing page & Admin panel)

packages/
  shared/     → Shared types, constants, URL validator
  queue/      → BullMQ queue definitions
  db/         → Prisma schema & client
  sdk/        → Public npm SDK
  tsconfig/   → Shared TypeScript configs
```

## Quick Start

### Prerequisites

- **Node.js** ≥ 20
- **pnpm** ≥ 9
- **Docker** (for PostgreSQL + Redis)

### Setup

```bash
# 1. Clone and install
pnpm install

# 2. Start infrastructure
docker compose up -d

# 3. Copy environment
cp .env.example .env

# 4. Push database schema
pnpm db:push

# 5. Seed test data
pnpm db:seed

# 6. Start development
pnpm dev
```

This starts all three services:

| Service        | URL                    |
|----------------|------------------------|
| **API Server** | http://localhost:3000   |
| **Dashboard**  | http://localhost:3300   |
| **Worker**     | Background process     |

### API Usage

```bash
# Health check
curl http://localhost:3000/api/health

# Take a screenshot (sync)
curl "http://localhost:3000/api/screenshot?url=https://example.com" \
  -H "Authorization: Bearer sfg_live_xxx"

# Take a screenshot (async)
curl -X POST http://localhost:3000/api/screenshot \
  -H "Authorization: Bearer sfg_live_xxx" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "async": true}'

# Check job status
curl http://localhost:3000/api/screenshot/{jobId} \
  -H "Authorization: Bearer sfg_live_xxx"
```

### SDK Usage

```typescript
import { ScreenshotAPI } from "@screenshot-api/sdk";

const client = new ScreenshotAPI({
  apiKey: process.env.SCREENSHOT_API_KEY!,
});

const result = await client.screenshot({
  url: "https://example.com",
  width: 1440,
  fullPage: true,
});

console.log(result.imageUrl);
```

## API Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `url` | string | required | Target URL to screenshot |
| `width` | number | 1440 | Viewport width |
| `height` | number | 900 | Viewport height |
| `fullPage` | boolean | false | Capture full scrollable page |
| `format` | string | "png" | Output format: png, jpeg, webp |
| `quality` | number | 80 | JPEG/WebP quality (1-100) |
| `delay` | number | 0 | Delay before capture (ms) |
| `selector` | string | – | CSS selector to capture |
| `darkMode` | boolean | false | Emulate dark color scheme |
| `deviceName` | string | – | Device preset name |
| `blockAds` | boolean | false | Block ads and trackers |
| `async` | boolean | false | Return job ID immediately |
| `webhookUrl` | string | – | Webhook URL for async notifications |

## Available Device Presets

`iphone-15-pro` · `iphone-14` · `iphone-se` · `ipad-pro-12` · `ipad-air` · `pixel-7` · `samsung-s24` · `desktop-hd` · `desktop-4k` · `macbook-pro-16`

## Documentation

| Document | Description |
|----------|-------------|
| [Getting Started](./docs/getting-started.md) | Full setup guide with prerequisites, installation, and troubleshooting |
| [API Reference](./docs/api-reference.md) | Complete reference for all REST endpoints |
| [SDK Guide](./docs/sdk-guide.md) | TypeScript SDK usage, error handling, and type reference |
| [Architecture](./docs/architecture.md) | System design, request flows, database schema, and security |
| [Deployment](./docs/deployment.md) | Production deployment (PaaS, VPS, Docker), storage, and scaling |
| [OAuth Setup](./docs/oauth-setup.md) | Step-by-step guide to setting up Google & GitHub authentication |
| [Storage Setup](./docs/storage-setup.md) | Cloudflare R2 configuration guide for production storage |
| [Contributing](./docs/contributing.md) | Development workflow, code conventions, and PR checklist |

## License

MIT
