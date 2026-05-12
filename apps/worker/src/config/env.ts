import { z } from "zod";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  DATABASE_URL: z.string(),
  STORAGE_PROVIDER: z.enum(["local", "r2", "s3"]).default("local"),
  STORAGE_PATH: z.string().default("./screenshots"),
  WORKER_CONCURRENCY: z.coerce.number().int().min(1).max(20).default(3),
  MAX_BROWSER_PAGES: z.coerce.number().int().min(10).max(200).default(50),
  SCREENSHOT_TIMEOUT: z.coerce.number().int().min(5000).max(120000).default(30000),

  // Cloudflare R2 (optional)
  R2_ENDPOINT: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional(),
  R2_PUBLIC_URL: z.string().optional(),
});

export type WorkerEnv = z.infer<typeof envSchema>;

export function loadWorkerEnv(): WorkerEnv {
  dotenv.config({ path: path.resolve(__dirname, "../../../../.env"), override: true });
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("❌ Invalid worker environment variables:");
    console.error(result.error.flatten().fieldErrors);
    process.exit(1);
  }

  return result.data;
}
