// ── Default Screenshot Settings ─────────────────────────────────

export const DEFAULTS = {
  WIDTH: 1440,
  HEIGHT: 900,
  FORMAT: "png" as const,
  FULL_PAGE: false,
  QUALITY: 80,
  DARK_MODE: false,
  BLOCK_ADS: false,
} as const;

// ── Limits ──────────────────────────────────────────────────────

export const LIMITS = {
  /** Maximum timeout for page navigation (ms). Set below gateway timeout (60s). */
  MAX_TIMEOUT: 45000,
  /** Maximum delay before screenshot (ms) */
  MAX_DELAY: 10000,
  /** Maximum viewport width */
  MAX_WIDTH: 3840,
  /** Maximum viewport height */
  MAX_HEIGHT: 2160,
  /** Minimum viewport width */
  MIN_WIDTH: 320,
  /** Minimum viewport height */
  MIN_HEIGHT: 240,
  /** Maximum URL length */
  MAX_URL_LENGTH: 2048,
  /** Maximum custom CSS length */
  MAX_CSS_LENGTH: 10000,
  /** Maximum custom JS length */
  MAX_JS_LENGTH: 10000,
  /** Cache TTL in seconds (1 hour) */
  CACHE_TTL: 3600,
  /** Maximum pages per browser before restart */
  MAX_BROWSER_PAGES: 50,
} as const;

// ── Rate Limit Tiers ────────────────────────────────────────────

export const RATE_LIMITS = {
  FREE: {
    requestsPerMinute: 10,
    requestsPerDay: 100,
  },
  PRO: {
    requestsPerMinute: 60,
    requestsPerDay: 10_000,
  },
  ENTERPRISE: {
    requestsPerMinute: 200,
    requestsPerDay: 100_000,
  },
} as const;

// ── Queue Names ─────────────────────────────────────────────────

export const QUEUE_NAMES = {
  get SCREENSHOT() {
    return process.env.SCREENSHOT_QUEUE_NAME || "screenshots";
  },
} as const;

// ── Redis Key Prefixes ──────────────────────────────────────────

export const REDIS_KEYS = {
  CACHE_PREFIX: "cache:screenshot:",
  QUOTA_PREFIX: "quota:",
  RATE_PREFIX: "rate:",
} as const;
