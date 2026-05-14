import { loadWorkerEnv } from "./config/env.js";
import { initBrowserPool, destroyBrowserPool, getPoolStats } from "./browser/pool.js";
import { createProcessor } from "./processor.js";
import { LocalStorageAdapter } from "./storage/local.js";
import { R2StorageAdapter } from "./storage/r2.js";
import type { StorageAdapter } from "./storage/interface.js";

async function main() {
  const env = loadWorkerEnv();

  // ── Initialize Storage Adapter ──────────────────────────────
  let storage: StorageAdapter;

  switch (env.STORAGE_PROVIDER) {
    case "r2":
      if (!env.R2_ENDPOINT || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY || !env.R2_BUCKET || !env.R2_PUBLIC_URL) {
        console.error("❌ R2 storage requires R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, and R2_PUBLIC_URL env vars");
        process.exit(1);
      }
      storage = new R2StorageAdapter({
        endpoint: env.R2_ENDPOINT,
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
        bucket: env.R2_BUCKET,
        publicUrl: env.R2_PUBLIC_URL,
      });
      break;
    case "local":
    default:
      storage = new LocalStorageAdapter(env.STORAGE_PATH);
      break;
  }

  // ── Initialize Browser Pool ─────────────────────────────────
  initBrowserPool({
    maxBrowsers: env.WORKER_CONCURRENCY,
    minBrowsers: 1,
    maxPagesPerBrowser: env.MAX_BROWSER_PAGES,
  });

  // ── Start Job Processor ─────────────────────────────────────
  const worker = createProcessor(env, storage);

  console.log(`
  ┌─────────────────────────────────────────┐
  │                                         │
  │   📸 Screenshot Worker                  │
  │                                         │
  │   → Concurrency: ${String(env.WORKER_CONCURRENCY).padEnd(20)}│
  │   → Storage: ${env.STORAGE_PROVIDER.padEnd(25)}│
  │   → Max pages/browser: ${String(env.MAX_BROWSER_PAGES).padEnd(14)}│
  │   → Timeout: ${String(env.SCREENSHOT_TIMEOUT).padEnd(24)}│
  │                                         │
  └─────────────────────────────────────────┘
  `);

  // ── Pool Stats Logging (every 60s) ─────────────────────────
  const statsInterval = setInterval(() => {
    const stats = getPoolStats();
    if (stats) {
      console.log(`📊 Pool stats: size=${stats.size} available=${stats.available} borrowed=${stats.borrowed} pending=${stats.pending} totalPages=${stats.totalPagesProcessed}`);
    }
  }, 60000);

  // ── Graceful Shutdown ───────────────────────────────────────
  const shutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
    clearInterval(statsInterval);

    // Stop accepting new jobs
    await worker.close();
    console.log("✅ Worker stopped accepting jobs");

    // Destroy browser pool
    await destroyBrowserPool();
    console.log("✅ Browser pool destroyed");

    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  // Handle uncaught errors
  process.on("uncaughtException", (err) => {
    console.error("💥 Uncaught exception:", err);
    shutdown("uncaughtException");
  });

  process.on("unhandledRejection", (reason) => {
    console.error("💥 Unhandled rejection:", reason);
  });
}

main();
