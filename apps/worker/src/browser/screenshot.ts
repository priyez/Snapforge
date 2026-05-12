import type { Page, ScreenshotOptions as PuppeteerScreenshotOptions } from "puppeteer";
import { acquireBrowser, releaseBrowser } from "./pool.js";
import { getDevicePreset } from "./devices.js";
import { validateUrl, type ScreenshotOptions, LIMITS, DEFAULTS } from "@screenshot-api/shared";

export interface ScreenshotResult {
  buffer: Buffer;
  contentType: string;
  renderTimeMs: number;
}

/**
 * Core screenshot generation logic.
 *
 * Flow:
 * 1. Acquire browser from pool
 * 2. Create new page
 * 3. Configure viewport, user agent, dark mode
 * 4. Navigate to URL (with timeout)
 * 5. Inject custom CSS/JS
 * 6. Take screenshot
 * 7. Close page, release browser
 */
export async function takeScreenshot(options: ScreenshotOptions): Promise<ScreenshotResult> {
  const startTime = Date.now();

  // Full SSRF validation with DNS resolution
  const urlValidation = await validateUrl(options.url);
  if (!urlValidation.valid) {
    throw new Error(`URL validation failed: ${urlValidation.reason}`);
  }

  const browser = await acquireBrowser();
  let page: Page | null = null;

  try {
    page = await browser.newPage();

    // ── Device Emulation ──────────────────────────────────────
    if (options.deviceName) {
      const preset = getDevicePreset(options.deviceName);
      if (preset) {
        await page.setViewport({
          width: preset.width,
          height: preset.height,
          deviceScaleFactor: preset.deviceScaleFactor,
          isMobile: preset.isMobile,
          hasTouch: preset.hasTouch,
        });
        await page.setUserAgent(preset.userAgent);
      } else {
        // Unknown device, use custom dimensions
        await page.setViewport({
          width: options.width || DEFAULTS.WIDTH,
          height: options.height || DEFAULTS.HEIGHT,
        });
      }
    } else {
      await page.setViewport({
        width: options.width || DEFAULTS.WIDTH,
        height: options.height || DEFAULTS.HEIGHT,
      });
    }

    // ── Dark Mode Emulation ───────────────────────────────────
    if (options.darkMode) {
      await page.emulateMediaFeatures([
        { name: "prefers-color-scheme", value: "dark" },
      ]);
    }

    // ── Block Ads & Trackers (lightweight approach) ───────────
    if (options.blockAds) {
      await page.setRequestInterception(true);
      page.on("request", (req) => {
        const resourceType = req.resourceType();
        const url = req.url();

        // Block known ad/tracking domains
        const blockedDomains = [
          "googlesyndication.com",
          "googleadservices.com",
          "doubleclick.net",
          "facebook.net",
          "analytics.google.com",
          "google-analytics.com",
          "hotjar.com",
          "intercom.io",
          "crisp.chat",
        ];

        if (
          blockedDomains.some((d) => url.includes(d)) ||
          resourceType === "media"
        ) {
          req.abort();
        } else {
          req.continue();
        }
      });
    }

    // ── Navigate ──────────────────────────────────────────────
    await page.goto(options.url, {
      waitUntil: "load",
      timeout: LIMITS.MAX_TIMEOUT,
    });

    // ── Inject Custom CSS ─────────────────────────────────────
    if (options.customCss) {
      await page.addStyleTag({ content: options.customCss });
    }

    // ── Execute Custom JavaScript ─────────────────────────────
    if (options.customJs) {
      await page.evaluate(options.customJs);
    }

    // ── Optional Delay ────────────────────────────────────────
    if (options.delay && options.delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, options.delay));
    }

    // ── Take Screenshot ───────────────────────────────────────
    const screenshotOptions: PuppeteerScreenshotOptions = {
      fullPage: options.fullPage,
      type: options.format === "png" ? "png" : "jpeg",
      ...(options.format !== "png" && options.quality
        ? { quality: options.quality }
        : {}),
    };

    // Capture specific element or full page
    let buffer: Buffer;
    if (options.selector) {
      const element = await page.$(options.selector);
      if (!element) {
        throw new Error(`Selector "${options.selector}" not found on page`);
      }
      buffer = (await element.screenshot(screenshotOptions)) as Buffer;
    } else {
      buffer = (await page.screenshot(screenshotOptions)) as Buffer;
    }

    const renderTimeMs = Date.now() - startTime;

    // Map format to MIME type
    const contentTypeMap: Record<string, string> = {
      png: "image/png",
      jpeg: "image/jpeg",
      webp: "image/webp",
    };

    return {
      buffer,
      contentType: contentTypeMap[options.format] || "image/png",
      renderTimeMs,
    };
  } finally {
    // Always close the page and release browser
    if (page) {
      try {
        await page.close();
      } catch {
        // Page may already be closed
      }
    }
    await releaseBrowser(browser);
  }
}
