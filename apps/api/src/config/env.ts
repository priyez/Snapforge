import { z } from "zod";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  DATABASE_URL: z.string(),
  STORAGE_PROVIDER: z.enum(["local", "r2", "s3"]).default("local"),
  STORAGE_PATH: z.string().default("./screenshots"),
  ADMIN_SECRET: z.string().optional(),

  // OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  DASHBOARD_URL: z.string().default("http://localhost:3300"),
  API_URL: z.string().default("http://localhost:3000"),
  DIRECT_SCREENSHOT: z.coerce.boolean().default(false),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(): Env {
  dotenv.config({ path: path.resolve(__dirname, "../../../../.env"), override: true });
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("❌ Invalid environment variables:");
    console.error(result.error.flatten().fieldErrors);
    process.exit(1);
  }

  return result.data;
}
