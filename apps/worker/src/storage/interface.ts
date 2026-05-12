/**
 * Storage adapter interface.
 * All storage backends (local, R2, S3) implement this contract.
 */
export interface StorageAdapter {
  /**
   * Upload a file to storage.
   * @returns Public URL of the uploaded file.
   */
  upload(key: string, buffer: Buffer, contentType: string): Promise<string>;

  /**
   * Get the public URL of a stored file.
   */
  getUrl(key: string): string;

  /**
   * Delete a file from storage.
   */
  delete(key: string): Promise<void>;

  /**
   * Check if a file exists in storage.
   */
  exists(key: string): Promise<boolean>;
}

/**
 * Generate a storage key with date-based path structure.
 * Example: screenshots/2026/05/08/a1b2c3d4.png
 */
export function generateStorageKey(hash: string, format: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `screenshots/${year}/${month}/${day}/${hash}.${format}`;
}
