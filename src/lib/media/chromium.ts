import chromium from "@sparticuz/chromium";
import { chromium as playwrightChromium, type Browser } from "playwright-core";

export const DEFAULT_VIEWPORT = { width: 1280, height: 720 };
export const NAV_TIMEOUT_MS = 15_000;

export async function launchServerlessChromium(): Promise<Browser> {
  return playwrightChromium.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  });
}

export function slugifyUrl(url: string): string {
  return (
    url
      .replace(/^https?:\/\//i, "")
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase()
      .slice(0, 60) || "site"
  );
}
