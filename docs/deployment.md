# Deployment

> Guide to deploying the Screenshot API to production.

---

## Overview

The platform consists of three services that can be deployed independently:

| Service       | Package                  | What it does                    |
|---------------|--------------------------|--------------------------------|
| **API Server** | `apps/api`              | Handles HTTP requests, auth, caching |
| **Worker**     | `apps/worker`           | Processes screenshot jobs (Puppeteer) |
| **Dashboard**  | `apps/dashboard`        | Static React SPA (Vite build)  |

You also need:

- **PostgreSQL** — Primary database
- **Redis** — Caching + BullMQ job queue

---

## Build for Production

```bash
# Build all packages and apps
pnpm build
```

This runs `turbo run build` which:

1. Generates Prisma client (`packages/db`)
2. Compiles shared packages (`packages/shared`, `packages/queue`)
3. Compiles the API server (`apps/api`) → `apps/api/dist/`
4. Compiles the worker (`apps/worker`) → `apps/worker/dist/`
5. Bundles the dashboard (`apps/dashboard`) → `apps/dashboard/dist/`

---

## Production Environment Variables

```env
# ── Server ──
PORT=3000
NODE_ENV=production

# ── Database ──
DATABASE_URL=postgresql://user:password@host:5432/screenshot_api

# ── Redis ──
REDIS_URL=redis://default:password@host:6379

# ── Storage (Cloudflare R2 recommended) ──
STORAGE_PROVIDER=r2
R2_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET=screenshots
R2_PUBLIC_URL=https://pub-xxx.r2.dev

# ── Auth ──
JWT_SECRET=your-secure-random-secret
ADMIN_SECRET=your-admin-secret

# ── Worker ──
WORKER_CONCURRENCY=5
MAX_BROWSER_PAGES=50
SCREENSHOT_TIMEOUT=30000
```

> **Critical:** Never reuse development secrets in production. Generate strong random values for `JWT_SECRET` and `ADMIN_SECRET`.

---

## Deployment Options

### Option 1 — Railway / Render (Recommended for getting started)

Both platforms support monorepo deployments.

#### API Server

```bash
# Start command
node apps/api/dist/index.js

# Build command
pnpm install && pnpm build
```

#### Worker

```bash
# Start command
node apps/worker/dist/index.js

# Build command
pnpm install && pnpm build
```

> **Note:** The worker requires a Chromium installation. Most PaaS platforms include it in their Node.js buildpacks. If not, add `puppeteer` to your build dependencies — it auto-downloads Chromium.

#### Dashboard

Deploy as a static site. After `pnpm build`, serve the contents of `apps/dashboard/dist/`.

#### Infrastructure

- **PostgreSQL:** Use Railway's managed Postgres or any hosted provider
- **Redis:** Use Railway's managed Redis or Upstash

---

### Option 2 — VPS / Bare Metal

#### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9
- PostgreSQL 16+
- Redis 7+
- Chromium/Chrome (for Puppeteer)

#### Setup

```bash
# 1. Clone and install
git clone https://github.com/your-org/screenshot-api.git
cd screenshot-api
pnpm install --frozen-lockfile

# 2. Build everything
pnpm build

# 3. Set environment variables
cp .env.example .env
# Edit .env with production values

# 4. Run database migrations
pnpm db:push

# 5. Start services
node apps/api/dist/index.js &
node apps/worker/dist/index.js &
```

#### Process Management (PM2)

```bash
# Install PM2
npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [
    {
      name: "screenshot-api",
      script: "apps/api/dist/index.js",
      instances: 1,
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "screenshot-worker",
      script: "apps/worker/dist/index.js",
      instances: 1,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
EOF

# Start all services
pm2 start ecosystem.config.cjs

# Save process list for auto-restart
pm2 save
pm2 startup
```

#### Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name dashboard.your-domain.com;

    root /path/to/screenshot-api/apps/dashboard/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

### Option 3 — Docker

#### Dockerfile (API)

```dockerfile
FROM node:20-slim AS base
RUN npm install -g pnpm@9

WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/ ./packages/

RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

CMD ["node", "apps/api/dist/index.js"]
```

#### Dockerfile (Worker)

```dockerfile
FROM node:20-slim AS base

# Install Chromium dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libasound2 \
    libatk1.0-0 \
    libdrm2 \
    libgbm1 \
    libnss3 \
    libxss1 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_DOWNLOAD=true

RUN npm install -g pnpm@9

WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/worker/package.json ./apps/worker/
COPY packages/ ./packages/

RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

CMD ["node", "apps/worker/dist/index.js"]
```

---

## Storage Configuration

### Local Storage (Development only)

```env
STORAGE_PROVIDER=local
STORAGE_PATH=./screenshots
```

Files are saved to disk and served via `@fastify/static`. Not suitable for production with multiple instances.

### Cloudflare R2 (Recommended)

```env
STORAGE_PROVIDER=r2
R2_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your-key
R2_SECRET_ACCESS_KEY=your-secret
R2_BUCKET=screenshots
R2_PUBLIC_URL=https://pub-xxx.r2.dev
```

**Setup steps:**

1. Create an R2 bucket in Cloudflare Dashboard
2. Create an API token with R2 read/write permissions
3. Enable public access or configure a custom domain
4. Set the `R2_PUBLIC_URL` to your public bucket URL

---

## Database Migrations

```bash
# Development — push schema directly (no migration history)
pnpm db:push

# Production — use migrations for controlled rollouts
pnpm db:migrate
```

---

## Health Checks

Configure your hosting provider to monitor:

| Endpoint              | Purpose                         | Expected |
|-----------------------|---------------------------------|----------|
| `GET /api/health`     | Basic liveness                  | 200      |
| `GET /api/health/ready` | Full readiness (Redis check)  | 200      |

---

## Scaling Considerations

### API Server

- Stateless — can run multiple instances behind a load balancer
- Redis-backed rate limiting works across instances
- JWT verification is stateless

### Worker

- Scale by running multiple worker instances
- Each worker manages its own browser pool
- BullMQ handles job distribution automatically
- Set `WORKER_CONCURRENCY` based on available memory (~500MB per browser)

### Memory Guidelines

| Component       | Minimum  | Recommended |
|-----------------|----------|-------------|
| API Server      | 256 MB   | 512 MB      |
| Worker (per)    | 1 GB     | 2 GB        |
| PostgreSQL      | 256 MB   | 1 GB        |
| Redis           | 128 MB   | 512 MB      |

---

## Monitoring

### Logs

- API: Structured JSON logs via Pino (Fastify's built-in logger)
- Worker: Console logs with emoji prefixes for quick scanning
- Use `pino-pretty` in development for readable output

### Key Metrics to Track

- Screenshot job queue depth (BullMQ)
- Job processing time (`renderTimeMs`)
- Cache hit ratio
- Browser pool utilization (logged every 60s by worker)
- API response times and error rates
