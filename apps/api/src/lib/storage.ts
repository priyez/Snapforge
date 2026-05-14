import { R2StorageAdapter, LocalStorageAdapter, type StorageAdapter } from "@screenshot-api/shared";
import { loadEnv } from "../config/env.js";

let storage: StorageAdapter | null = null;

export function getStorageAdapter(): StorageAdapter {
  if (storage) return storage;

  const env = loadEnv();

  if (env.STORAGE_PROVIDER === "r2") {
    storage = new R2StorageAdapter({
      endpoint: process.env.R2_ENDPOINT!,
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      bucket: process.env.R2_BUCKET!,
      publicUrl: process.env.R2_PUBLIC_URL!,
    });
  } else {
    storage = new LocalStorageAdapter(process.env.STORAGE_PATH || "./screenshots");
  }

  return storage;
}
