# Getting Started

> Complete guide to setting up and running the Screenshot API locally.

---

## Prerequisites

Before starting, ensure you have the following installed:

| Tool       | Version  | Purpose                      |
|------------|----------|------------------------------|
| **Node.js** | ≥ 20.0.0 | JavaScript runtime           |
| **pnpm**    | ≥ 9.15.0 | Package manager (monorepo)   |
| **Docker**  | Latest   | PostgreSQL & Redis containers |
| **Git**     | Latest   | Version control              |

### Installing pnpm

If you don't have pnpm installed:

```bash
# Using npm
npm install -g pnpm@9

# Or using Corepack (ships with Node.js ≥ 16)
corepack enable
corepack prepare pnpm@9.15.0 --activate
```

---

## Step 1 — Clone & Install

```bash
# Clone the repository
git clone https://github.com/your-org/screenshot-api.git
cd screenshot-api

# Install all dependencies across the monorepo
pnpm install
```

This installs dependencies for all workspaces: `apps/*` and `packages/*`.

---

## Step 2 — Start Infrastructure

The project requires **PostgreSQL** and **Redis**. Start them with Docker Compose:

```bash
docker compose up -d
```

This spins up two containers:

| Service       | Container Name             | Port  | Credentials                  |
|---------------|----------------------------|-------|------------------------------|
| **PostgreSQL** | `screenshot-api-postgres`  | 5432  | `postgres` / `postgres`      |
| **Redis**      | `screenshot-api-redis`     | 6379  | No password (local dev)      |

#### Verify containers are running:

```bash
docker compose ps
```

> **Note:** If you prefer to use external/managed PostgreSQL and Redis (e.g., Railway, Supabase, Upstash), skip Docker and configure the connection URLs directly in your `.env` file.

---

## Step 3 — Configure Environment

```bash
# Copy the example environment file
cp .env.example .env
```

Then open `.env` and update the values:

```env
# ── Server ──
PORT=3000
NODE_ENV=development

# ── Database ──
# For local Docker:
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/screenshot_api
# Or use a remote database URL

# ── Redis ──
# For local Docker:
REDIS_URL=redis://localhost:6379
# Or use a remote Redis URL

# ── Storage ──
STORAGE_PROVIDER=local
STORAGE_PATH=./screenshots

# ── Worker ──
WORKER_CONCURRENCY=3
MAX_BROWSER_PAGES=50
SCREENSHOT_TIMEOUT=30000
```

### Environment Variables Reference

| Variable              | Required | Default       | Description                                     |
|-----------------------|----------|---------------|-------------------------------------------------|
| `PORT`                | No       | `3000`        | API server port                                 |
| `NODE_ENV`            | No       | `development` | Environment mode                                |
| `DATABASE_URL`        | **Yes**  | —             | PostgreSQL connection string                    |
| `REDIS_URL`           | No       | `redis://localhost:6379` | Redis connection string              |
| `STORAGE_PROVIDER`    | No       | `local`       | Storage backend: `local`, `r2`, or `s3`         |
| `STORAGE_PATH`        | No       | `./screenshots` | Local storage directory                       |
| `WORKER_CONCURRENCY`  | No       | `3`           | Number of concurrent browser instances          |
| `MAX_BROWSER_PAGES`   | No       | `50`          | Max pages per browser                           |
| `SCREENSHOT_TIMEOUT`  | No       | `30000`       | Screenshot timeout in milliseconds              |
| `R2_ENDPOINT`         | If R2    | —             | Cloudflare R2 endpoint URL                      |
| `R2_ACCESS_KEY_ID`    | If R2    | —             | R2 access key                                   |
| `R2_SECRET_ACCESS_KEY` | If R2   | —             | R2 secret key                                   |
| `R2_BUCKET`           | If R2    | —             | R2 bucket name                                  |
| `R2_PUBLIC_URL`       | If R2    | —             | R2 public URL for serving images                |
| `ADMIN_SECRET`        | No       | —             | Admin secret for protected operations           |

---

## Step 4 — Initialize the Database

```bash
# Push the Prisma schema to your database
pnpm db:push

# Seed test data (creates dev user + API key)
pnpm db:seed
```

The seed command will output your development API key:

```
🌱 Seeding database...

✅ User created: dev@screenshot-api.local
✅ API Key created: sfg_live_xxxxxxxx...

🔑 Your development API key (save this!):

   sfg_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

   Add to your .env or SDK config.
```

> **Important:** Copy this API key! It's shown only once during seeding.

### Other Database Commands

```bash
# Open Prisma Studio (visual database browser)
pnpm db:studio

# Run database migrations
pnpm db:migrate
```

---

## Step 5 — Start Development

```bash
# Start all services concurrently (API + Worker + Dashboard)
pnpm dev
```

This uses **Turborepo** to run all workspace `dev` scripts in parallel:

| Service        | URL                    | Description                      |
|----------------|------------------------|----------------------------------|
| **API Server** | http://localhost:3000   | Fastify REST API                 |
| **Dashboard**  | http://localhost:3300   | Vite + React management UI      |
| **Worker**     | Background process     | BullMQ screenshot processor      |

### Running Services Individually

If you want to run services individually:

```bash
# API only
pnpm --filter @screenshot-api/api dev

# Worker only
pnpm --filter @screenshot-api/worker dev

# Dashboard only
pnpm --filter frontend dev
```

---

## Step 6 — Verify It Works

### Health Check

```bash
curl http://localhost:3000/api/health
```

Expected response:

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

### Readiness Check (includes Redis)

```bash
curl http://localhost:3000/api/health/ready
```

### Take Your First Screenshot

```bash
curl "http://localhost:3000/api/screenshot?url=https://example.com" \
  -H "Authorization: Bearer YOUR_API_KEY_HERE"
```

---

## Common Issues

### Docker not running

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Fix:** Make sure Docker Desktop is running and containers are up:

```bash
docker compose up -d
```

### Database connection failed

```
❌ Invalid environment variables: DATABASE_URL
```

**Fix:** Ensure `DATABASE_URL` is set in your `.env` file and the database is accessible.

### Puppeteer browser launch fails

```
Error: Failed to launch the browser process
```

**Fix:** The worker uses Puppeteer which requires Chrome/Chromium. On first run, Puppeteer downloads Chromium automatically. If you're behind a firewall, set:

```bash
PUPPETEER_SKIP_DOWNLOAD=true
```

And install Chrome manually.

### Port already in use

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Fix:** Change the `PORT` value in your `.env` file, or kill the process using the port:

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9
```

---

## Next Steps

- Read the [API Reference](./api-reference.md) for all available endpoints
- Check the [SDK Guide](./sdk-guide.md) for TypeScript integration
- Review the [Architecture](./architecture.md) for system design details
- See [Deployment](./deployment.md) for production setup
