import sharp from "sharp";

export interface ProcessedMedia {
  url: string;
  width: number;
  height: number;
  format: string;
  sizeBytes: number;
}

const X_MAX_DIMENSION = 4096;
const X_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Process an image buffer for X posting constraints.
 * Resizes to fit within 4096x4096 and compresses to stay under 5MB.
 */
export async function processImage(
  input: Buffer,
  options?: { maxWidth?: number; maxHeight?: number; quality?: number }
): Promise<Buffer> {
  const maxWidth = options?.maxWidth ?? X_MAX_DIMENSION;
  const maxHeight = options?.maxHeight ?? X_MAX_DIMENSION;
  const quality = options?.quality ?? 85;

  let pipeline = sharp(input).rotate();

  const metadata = await pipeline.metadata();
  const width = metadata.width ?? maxWidth;
  const height = metadata.height ?? maxHeight;

  if (width > maxWidth || height > maxHeight) {
    pipeline = pipeline.resize(maxWidth, maxHeight, {
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  let output = await pipeline.jpeg({ quality, mozjpeg: true }).toBuffer();

  // Reduce quality if still over size limit
  let currentQuality = quality;
  while (output.length > X_MAX_FILE_SIZE && currentQuality > 40) {
    currentQuality -= 10;
    output = await sharp(input)
      .rotate()
      .resize(maxWidth, maxHeight, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: currentQuality, mozjpeg: true })
      .toBuffer();
  }

  return output;
}

/**
 * Validate media URLs for X posting (images only for now).
 */
export function validateMediaUrls(urls: string[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

  if (urls.length > 4) {
    errors.push("Maximum 4 media attachments allowed");
  }

  for (const url of urls) {
    try {
      const parsed = new URL(url);
      const ext = parsed.pathname.toLowerCase().match(/\.[^.]+$/)?.[0];
      if (!ext || !allowedExtensions.includes(ext)) {
        errors.push(`Unsupported media format: ${url}`);
      }
    } catch {
      errors.push(`Invalid URL: ${url}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Get media metadata from a buffer without full processing.
 */
export async function getMediaMetadata(input: Buffer): Promise<{
  width: number;
  height: number;
  format: string;
  sizeBytes: number;
}> {
  const metadata = await sharp(input).metadata();
  return {
    width: metadata.width ?? 0,
    height: metadata.height ?? 0,
    format: metadata.format ?? "unknown",
    sizeBytes: input.length,
  };
}
