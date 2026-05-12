// ── SDK Types ───────────────────────────────────────────────────

export interface ScreenshotAPIConfig {
  /** Your API key (starts with sk_live_) */
  apiKey: string;
  /** Base URL of the API server */
  baseUrl?: string;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Number of retry attempts */
  retries?: number;
}

export interface ScreenshotOptions {
  /** Target URL to screenshot */
  url: string;
  /** Viewport width (default: 1440) */
  width?: number;
  /** Viewport height (default: 900) */
  height?: number;
  /** Capture full scrollable page */
  fullPage?: boolean;
  /** Image format: png, jpeg, webp */
  format?: "png" | "jpeg" | "webp";
  /** JPEG/WebP quality (1-100) */
  quality?: number;
  /** Delay in ms before capture */
  delay?: number;
  /** CSS selector to capture specific element */
  selector?: string;
  /** Emulate dark color scheme */
  darkMode?: boolean;
  /** Device preset name */
  deviceName?: string;
  /** Custom CSS to inject */
  customCss?: string;
  /** Custom JavaScript to execute */
  customJs?: string;
  /** Block ads and cookie banners */
  blockAds?: boolean;
  /** Webhook URL for async notifications */
  webhookUrl?: string;
}

export interface ScreenshotResult {
  imageUrl: string;
  format: string;
  width: number;
  height: number;
  renderTimeMs: number;
  cached: boolean;
  expiresAt: string;
}

export interface AsyncJobResult {
  jobId: string;
  status: "queued" | "processing" | "completed" | "failed";
  statusUrl: string;
}

export interface JobStatusResult {
  jobId: string;
  status: "queued" | "processing" | "completed" | "failed";
  imageUrl?: string;
  format?: string;
  width?: number;
  height?: number;
  renderTimeMs?: number;
  cached?: boolean;
  error?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
