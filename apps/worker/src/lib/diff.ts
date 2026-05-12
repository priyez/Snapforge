import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

export interface DiffResult {
  diffPercentage: number;
  diffBuffer: Buffer | null;
  width: number;
  height: number;
}

/**
 * Compare two PNG buffers and return the difference percentage and a diff image buffer.
 */
export async function compareScreenshots(
  img1Buffer: Buffer,
  img2Buffer: Buffer
): Promise<DiffResult> {
  const img1 = PNG.sync.read(img1Buffer);
  const img2 = PNG.sync.read(img2Buffer);

  const { width, height } = img1;

  // Images must have same dimensions for pixelmatch
  // If not, we could resize, but for simplicity we'll assume they match or return 100% diff
  if (img1.width !== img2.width || img1.height !== img2.height) {
    return {
      diffPercentage: 100,
      diffBuffer: null,
      width: img1.width,
      height: img1.height,
    };
  }

  const diff = new PNG({ width, height });

  const diffPixels = pixelmatch(
    img1.data,
    img2.data,
    diff.data,
    width,
    height,
    { threshold: 0.1 }
  );

  const diffPercentage = (diffPixels / (width * height)) * 100;
  const diffBuffer = diffPixels > 0 ? PNG.sync.write(diff) : null;

  return {
    diffPercentage,
    diffBuffer,
    width,
    height,
  };
}
