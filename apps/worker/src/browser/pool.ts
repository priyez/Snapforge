import { createPool, type Pool } from "generic-pool";
import vanillaPuppeteer, { type Browser } from "puppeteer";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { addExtra } from "puppeteer-extra";
import { existsSync } from "node:fs";

const puppeteer = addExtra(vanillaPuppeteer as any);

// Register stealth plugin to avoid bot detection
puppeteer.use(StealthPlugin());

/**
 * Auto-detect a Chrome/Chromium/Edge executable on the system.
 * Used when Puppeteer's bundled browser download is skipped.
 */
function findSystemChrome(): string | undefined {
  const candidates = [
    // Windows paths
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    // Linux paths
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    // macOS paths
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  ];

  for (const path of candidates) {
    if (existsSync(path)) {
      return path;
    }
  }

  return undefined;
}

// ── Browser Pool ────────────────────────────────────────────────

let pool: Pool<Browser> | null = null;
let totalPagesCreated = 0;

/**
 * Chrome launch arguments optimized for headless screenshots.
 */
const CHROME_ARGS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
  "--disable-gpu",
  "--disable-extensions",
  "--disable-background-networking",
  "--disable-background-timer-throttling",
  "--disable-backgrounding-occluded-windows",
  "--disable-breakpad",
  "--disable-component-update",
  "--disable-default-apps",
  "--disable-domain-reliability",
  "--disable-features=AudioServiceOutOfProcess",
  "--disable-hang-monitor",
  "--disable-ipc-flooding-protection",
  "--disable-popup-blocking",
  "--disable-prompt-on-repost",
  "--disable-renderer-backgrounding",
  "--disable-sync",
  "--disable-translate",
  "--metrics-recording-only",
  "--no-first-run",
  "--safebrowsing-disable-auto-update",
  "--hide-scrollbars",
  "--mute-audio",
];

interface PoolConfig {
  maxBrowsers: number;
  minBrowsers: number;
  maxPagesPerBrowser: number;
  idleTimeoutMs: number;
}

const DEFAULT_POOL_CONFIG: PoolConfig = {
  maxBrowsers: 3,
  minBrowsers: 1,
  maxPagesPerBrowser: 50,
  idleTimeoutMs: 60000,
};

/**
 * Initialize the browser pool.
 * Must be called once at worker startup.
 */
export function initBrowserPool(config: Partial<PoolConfig> = {}): Pool<Browser> {
  const cfg = { ...DEFAULT_POOL_CONFIG, ...config };

  const factory = {
    create: async (): Promise<Browser> => {
      console.log("🌐 Launching new browser instance...");
      const executablePath = findSystemChrome();
      if (executablePath) {
        console.log(`   Using browser: ${executablePath}`);
      }
      const browser = await puppeteer.launch({
        headless: true,
        args: CHROME_ARGS,
        ...(executablePath ? { executablePath } : {}),
        protocolTimeout: 60000,
      });

      browser.on("disconnected", () => {
        console.log("⚠️ Browser disconnected unexpectedly");
      });

      return browser as unknown as Browser;
    },

    destroy: async (browser: Browser): Promise<void> => {
      console.log("🔴 Closing browser instance...");
      try {
        await browser.close();
      } catch (err) {
        console.error("Failed to close browser:", err);
        // Force kill the process if close fails
        const proc = browser.process();
        if (proc) {
          proc.kill("SIGKILL");
        }
      }
    },

    validate: async (browser: Browser): Promise<boolean> => {
      try {
        // Check if browser is still responsive
        await browser.version();
        return true;
      } catch {
        return false;
      }
    },
  };

  pool = createPool(factory, {
    max: cfg.maxBrowsers,
    min: cfg.minBrowsers,
    idleTimeoutMillis: cfg.idleTimeoutMs,
    testOnBorrow: true, // Validate browser before lending
    acquireTimeoutMillis: 30000, // Max wait to acquire a browser
    evictionRunIntervalMillis: 30000, // Check for idle browsers every 30s
  });

  pool.on("factoryCreateError", (err) => {
    console.error("❌ Browser pool create error:", err);
  });

  pool.on("factoryDestroyError", (err) => {
    console.error("❌ Browser pool destroy error:", err);
  });

  console.log(
    `✅ Browser pool initialized (min: ${cfg.minBrowsers}, max: ${cfg.maxBrowsers})`
  );

  return pool;
}

/**
 * Acquire a browser from the pool.
 * Always release it back when done.
 */
export async function acquireBrowser(): Promise<Browser> {
  if (!pool) {
    throw new Error("Browser pool not initialized. Call initBrowserPool() first.");
  }
  return pool.acquire();
}

/**
 * Release a browser back to the pool.
 * If the browser has served too many pages, destroy it instead.
 */
export async function releaseBrowser(
  browser: Browser,
  maxPages: number = DEFAULT_POOL_CONFIG.maxPagesPerBrowser
): Promise<void> {
  if (!pool) return;

  totalPagesCreated++;

  // Recycle browser after maxPages to prevent memory leaks
  if (totalPagesCreated % maxPages === 0) {
    console.log(`♻️ Recycling browser after ${maxPages} pages`);
    await pool.destroy(browser);
  } else {
    await pool.release(browser);
  }
}

/**
 * Drain and shut down the entire pool.
 * Call this on graceful shutdown.
 */
export async function destroyBrowserPool(): Promise<void> {
  if (!pool) return;

  console.log("🛑 Draining browser pool...");
  await pool.drain();
  await pool.clear();
  pool = null;
  console.log("✅ Browser pool destroyed");
}

/**
 * Get pool stats for monitoring.
 */
export function getPoolStats() {
  if (!pool) return null;
  return {
    size: pool.size,
    available: pool.available,
    borrowed: pool.borrowed,
    pending: pool.pending,
    totalPagesCreated,
  };
}
