import { mkdtemp, readFile, rm } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import { put } from "@vercel/blob";
import {
  launchServerlessChromium,
  DEFAULT_VIEWPORT,
  NAV_TIMEOUT_MS,
  slugifyUrl,
} from "@/lib/media/chromium";

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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Playwright-core records WebM via Chromium's screencast (no ffmpeg).
 * Closing the browser context finalizes the file on disk.
 */
export async function recordSiteVideo(
  options: VideoRecordingOptions
): Promise<VideoRecordingResult> {
  const duration = options.duration ?? 15;
  const viewport = options.viewport ?? DEFAULT_VIEWPORT;
  const slug = `${slugifyUrl(options.url)}-${Date.now()}`;
  const tmpDir = await mkdtemp(path.join(tmpdir(), "sorano-video-"));
  let browser: Awaited<ReturnType<typeof launchServerlessChromium>> | null = null;

  try {
    browser = await launchServerlessChromium();
    const context = await browser.newContext({
      viewport,
      recordVideo: { dir: tmpDir, size: viewport },
    });
    const page = await context.newPage();

    try {
      await page.goto(options.url, { waitUntil: "networkidle", timeout: NAV_TIMEOUT_MS });
    } catch (err) {
      throw new Error(
        `Video capture navigation failed for ${options.url}: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }

    const steps = Math.max(3, Math.min(8, Math.round(duration / 2)));
    const stepWaitMs = Math.max(250, Math.floor((duration * 1000) / steps));
    for (let i = 1; i <= steps; i++) {
      const progress = i / steps;
      await page.evaluate((p) => {
        const scrolling = document.scrollingElement ?? document.documentElement;
        const max = Math.max(0, scrolling.scrollHeight - window.innerHeight);
        scrolling.scrollTo({ top: max * p, behavior: "auto" });
      }, progress);
      await sleep(stepWaitMs);
    }

    const thumbnail = await page.screenshot({ type: "png" });
    const video = page.video();
    await page.close();
    await context.close();

    if (!video) {
      throw new Error("Video capture failed: Playwright did not produce a video file");
    }

    const videoPath = await video.path();
    const videoBuffer = await readFile(videoPath);

    const [videoBlob, thumbBlob] = await Promise.all([
      put(`videos/${slug}.webm`, videoBuffer, {
        access: "public",
        contentType: "video/webm",
      }),
      put(`videos/${slug}-thumb.png`, thumbnail, {
        access: "public",
        contentType: "image/png",
      }),
    ]);

    return {
      videoUrl: videoBlob.url,
      thumbnailUrl: thumbBlob.url,
      duration,
    };
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Video capture")) {
      throw err;
    }
    throw new Error(
      `Video capture failed for ${options.url}: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  } finally {
    if (browser) {
      await browser.close().catch(() => undefined);
    }
    await rm(tmpDir, { recursive: true, force: true }).catch(() => undefined);
  }
}
