/**
 * Scrape a target URL and extract context for project onboarding.
 */
export interface ScrapedContext {
  title: string;
  description: string;
  tagline: string;
  keywords: string[];
}

export async function scrapeUrl(url: string): Promise<ScrapedContext> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Sorano/1.0 (+https://sorano.app)" },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    const html = await response.text();
    return parseHtmlMeta(html, url);
  } catch {
    return fallbackContext(url);
  }
}

function parseHtmlMeta(html: string, url: string): ScrapedContext {
  const title =
    extractMeta(html, "og:title") ??
    extractTag(html, "title") ??
    new URL(url).hostname;

  const description =
    extractMeta(html, "og:description") ??
    extractMeta(html, "description") ??
    "";

  const keywordsRaw = extractMeta(html, "keywords") ?? "";
  const keywords = keywordsRaw
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  return {
    title: title.slice(0, 100),
    description: description.slice(0, 500),
    tagline: description.slice(0, 200),
    keywords,
  };
}

function extractMeta(html: string, name: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${name}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${name}["']`, "i"),
    new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`, "i"),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtmlEntities(match[1]);
  }
  return null;
}

function extractTag(html: string, tag: string): string | null {
  const match = html.match(new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`, "i"));
  return match?.[1] ? decodeHtmlEntities(match[1].trim()) : null;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function fallbackContext(url: string): ScrapedContext {
  const hostname = new URL(url).hostname.replace("www.", "");
  return {
    title: hostname,
    description: `Launch project for ${hostname}`,
    tagline: `Building in public at ${hostname}`,
    keywords: [hostname.split(".")[0], "launch", "saas"],
  };
}
