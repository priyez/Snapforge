// ── Screenshot Options ──────────────────────────────────────────

export interface ScreenshotOptions {
  /** Target URL to capture */
  url: string;
  /** Viewport width in pixels */
  width: number;
  /** Viewport height in pixels */
  height: number;
  /** Capture full scrollable page */
  fullPage: boolean;
  /** Output image format */
  format: ImageFormat;
  /** JPEG/WebP quality (1-100) */
  quality?: number;
  /** Delay in ms before capture (after page load) */
  delay?: number;
  /** CSS selector to capture specific element */
  selector?: string;
  /** Emulate dark color scheme */
  darkMode?: boolean;
  /** Named device preset (e.g. "iPhone 15", "iPad Pro") */
  deviceName?: string;
  /** Custom CSS to inject before capture */
  customCss?: string;
  /** Custom JavaScript to execute before capture */
  customJs?: string;
  /** Block ads and cookie banners */
  blockAds?: boolean;
}

export type ImageFormat = "png" | "jpeg" | "webp";

// ── Job Types ───────────────────────────────────────────────────

export interface ScreenshotJobData extends ScreenshotOptions {
  /** Unique cache key for deduplication */
  cacheKey: string;
  /** User ID for tracking */
  userId?: string;
  /** Schedule ID if this was a recurring job */
  scheduleId?: string;
  /** Webhook URL for async notifications */
  webhookUrl?: string;
  /** Whether to wait for result */
  async?: boolean;
}

export interface JobResult {
  /** Job ID */
  id: string;
  /** Current job status */
  status: JobStatus;
  /** CDN/public URL of the screenshot */
  imageUrl?: string;
  /** Time taken to render in milliseconds */
  renderTimeMs?: number;
  /** Whether result was served from cache */
  cached: boolean;
  /** Error message if failed */
  error?: string;
  /** Timestamp when the job was created */
  createdAt: string;
  /** Timestamp when the job completed */
  completedAt?: string;
}

export type JobStatus = "queued" | "processing" | "completed" | "failed";

// ── API Response Types ──────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface ScreenshotResponse {
  imageUrl: string;
  format: ImageFormat;
  width: number;
  height: number;
  renderTimeMs: number;
  cached: boolean;
  expiresAt: string;
}

export interface AsyncScreenshotResponse {
  jobId: string;
  status: JobStatus;
  statusUrl: string;
}

// ── Storage Types ───────────────────────────────────────────────

export interface StorageConfig {
  provider: "local" | "r2" | "s3";
  localPath?: string;
  r2?: {
    endpoint: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucket: string;
    publicUrl: string;
  };
}
