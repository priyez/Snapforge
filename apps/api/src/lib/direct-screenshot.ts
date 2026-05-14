import puppeteer from "puppeteer";
import { 
  type ScreenshotOptions, 
  DEFAULTS, 
  LIMITS,
  validateUrl,
  getDevicePreset,
} from "@screenshot-api/shared";

export interface DirectScreenshotResult {
  buffer: Buffer;
  contentType: string;
  renderTimeMs: number;
}

/**
 * Direct screenshot generation (bypasses queue).
 * Used for local development and debugging.
 */
export async function takeDirectScreenshot(options: ScreenshotOptions): Promise<DirectScreenshotResult> {
  const startTime = Date.now();

  // Validate URL
  const urlValidation = await validateUrl(options.url);
  if (!urlValidation.valid) {
    throw new Error(`URL validation failed: ${urlValidation.reason}`);
  }

  // Determine browser path (Windows local dev vs production)
  const executablePath = 
    process.env.NODE_ENV === "development" && process.platform === "win32"
      ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
      : process.env.PUPPETEER_EXECUTABLE_PATH;

  // Launch a temporary browser
  const browser = await puppeteer.launch({
    headless: true,
    executablePath,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    const page = await browser.newPage();

    // Viewport & Device
    if (options.deviceName) {
      const preset = getDevicePreset(options.deviceName);
      if (preset) {
        await page.setViewport({
          width: preset.width,
          height: preset.height,
          deviceScaleFactor: preset.deviceScaleFactor,
          isMobile: preset.isMobile,
        });
        await page.setUserAgent(preset.userAgent);
      }
    } else {
      await page.setViewport({
        width: options.width || DEFAULTS.WIDTH,
        height: options.height || DEFAULTS.HEIGHT,
      });
    }

    // Navigate
    await page.goto(options.url, {
      waitUntil: "load",
      timeout: LIMITS.MAX_TIMEOUT,
    });

    // Custom CSS/JS
    if (options.customCss) await page.addStyleTag({ content: options.customCss });
    if (options.customJs) await page.evaluate(options.customJs);
    if (options.delay) await new Promise(r => setTimeout(r, options.delay));

    // Screenshot
    const buffer = (await page.screenshot({
      fullPage: options.fullPage,
      type: options.format === "png" ? "png" : "jpeg",
      ...(options.format !== "png" ? { quality: options.quality } : {}),
    })) as Buffer;

    return {
      buffer,
      contentType: options.format === "png" ? "image/png" : "image/jpeg",
      renderTimeMs: Date.now() - startTime,
    };
  } finally {
    await browser.close();
  }
}
