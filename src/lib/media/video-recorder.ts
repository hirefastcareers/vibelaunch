/**
 * Playwright video recording service stub.
 * In production, spins up Playwright to record a target URL walkthrough.
 */
export interface VideoRecordingOptions {
  url: string;
  duration?: number;
  viewport?: { width: number; height: number };
}

export interface VideoRecordingResult {
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
}

export async function recordSiteVideo(
  options: VideoRecordingOptions
): Promise<VideoRecordingResult> {
  const duration = options.duration ?? 15;
  const slug = Buffer.from(options.url).toString("base64url").slice(0, 12);

  return {
    videoUrl: `/api/media/placeholder?type=video&url=${encodeURIComponent(options.url)}`,
    thumbnailUrl: `/api/media/placeholder?type=thumbnail&id=${slug}`,
    duration,
  };
}
