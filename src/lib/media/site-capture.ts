import { put } from "@vercel/blob";
import {
  launchServerlessChromium,
  DEFAULT_VIEWPORT,
  NAV_TIMEOUT_MS,
  slugifyUrl,
} from "@/lib/media/chromium";

export async function captureSiteScreenshot(
  url: string
): Promise<{ blobUrl: string; capturedAt: Date }> {
  let browser: Awaited<ReturnType<typeof launchServerlessChromium>> | null = null;

  try {
    browser = await launchServerlessChromium();
    const page = await browser.newPage();
    await page.setViewportSize(DEFAULT_VIEWPORT);

    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: NAV_TIMEOUT_MS });
    } catch (err) {
      throw new Error(
        `Site capture navigation failed for ${url}: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }

    const screenshot = await page.screenshot({ type: "png" });
    const blob = await put(`captures/${slugifyUrl(url)}-${Date.now()}.png`, screenshot, {
      access: "public",
      contentType: "image/png",
    });

    return { blobUrl: blob.url, capturedAt: new Date() };
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Site capture")) {
      throw err;
    }
    throw new Error(
      `Site capture failed for ${url}: ${err instanceof Error ? err.message : String(err)}`
    );
  } finally {
    if (browser) {
      await browser.close().catch(() => undefined);
    }
  }
}
