import { mkdir, writeFile, unlink, access } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { StorageAdapter } from "./interface.js";

/**
 * Local filesystem storage adapter.
 * Used for development and MVP.
 */
export class LocalStorageAdapter implements StorageAdapter {
  private basePath: string;

  constructor(basePath: string) {
    this.basePath = resolve(basePath);
  }

  async upload(key: string, buffer: Buffer, _contentType: string): Promise<string> {
    const filePath = resolve(this.basePath, key);
    const dir = dirname(filePath);

    // Ensure directory exists
    await mkdir(dir, { recursive: true });

    // Write file
    await writeFile(filePath, buffer);

    // Return a path-based URL (served by Fastify static in dev)
    return `/${key}`;
  }

  getUrl(key: string): string {
    return `/${key}`;
  }

  async delete(key: string): Promise<void> {
    const filePath = resolve(this.basePath, key);
    try {
      await unlink(filePath);
    } catch {
      // File may not exist, ignore
    }
  }

  async exists(key: string): Promise<boolean> {
    const filePath = resolve(this.basePath, key);
    try {
      await access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
