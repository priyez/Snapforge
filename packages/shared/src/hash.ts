import { createHash } from "node:crypto";
import type { ScreenshotOptions } from "./types.js";

/**
 * Generate a deterministic cache key from screenshot options.
 * Used for Redis caching and deduplication of identical requests.
 */
export function generateCacheKey(options: ScreenshotOptions): string {
  const normalized = {
    url: options.url.toLowerCase().trim(),
    width: options.width,
    height: options.height,
    fullPage: options.fullPage,
    format: options.format,
    quality: options.quality,
    delay: options.delay,
    selector: options.selector,
    darkMode: options.darkMode,
    deviceName: options.deviceName,
    customCss: options.customCss,
    customJs: options.customJs,
    blockAds: options.blockAds,
  };

  const raw = JSON.stringify(normalized);
  return createHash("sha256").update(raw).digest("hex");
}
