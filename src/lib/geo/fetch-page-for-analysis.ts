/**
 * Fetch competitor pages for gap analysis with robots.txt respect.
 * Failures are returned as notes — never invented page content.
 */

export type PageFetchStatus =
  | "ok"
  | "blocked_by_robots"
  | "failed"
  | "skipped";

export type PageFetchResult = {
  url: string;
  status: PageFetchStatus;
  detail?: string;
  /** Plain text excerpt when status=ok (HTML tags stripped). */
  textExcerpt?: string;
};

const FETCH_TIMEOUT_MS = 8_000;
const MAX_EXCERPT_CHARS = 4_000;
const USER_AGENT = "XoopaGapAnalysisBot/1.0 (+https://xoopa.app)";

type RobotsCacheEntry = { fetchedAt: number; disallows: string[] };
const robotsCache = new Map<string, RobotsCacheEntry>();

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Minimal robots.txt check for User-agent: * Disallow rules.
 * Fail-open on robots fetch errors (record note separately if page fails).
 */
export async function isPathAllowedByRobots(
  pageUrl: string
): Promise<{ allowed: boolean; robotsUrl: string; detail?: string }> {
  let parsed: URL;
  try {
    parsed = new URL(pageUrl);
  } catch {
    return { allowed: false, robotsUrl: "", detail: "invalid url" };
  }

  const robotsUrl = `${parsed.origin}/robots.txt`;
  const cached = robotsCache.get(parsed.origin);
  let disallows: string[];

  if (cached && Date.now() - cached.fetchedAt < 10 * 60_000) {
    disallows = cached.disallows;
  } else {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      const res = await fetch(robotsUrl, {
        signal: controller.signal,
        headers: { "User-Agent": USER_AGENT },
        redirect: "follow",
      });
      clearTimeout(timer);
      if (!res.ok) {
        disallows = [];
      } else {
        const body = await res.text();
        disallows = parseRobotsDisallows(body);
      }
      robotsCache.set(parsed.origin, { fetchedAt: Date.now(), disallows });
    } catch (err) {
      return {
        allowed: true,
        robotsUrl,
        detail: `robots.txt unreachable (${err instanceof Error ? err.message : "error"}); proceeding cautiously`,
      };
    }
  }

  const path = parsed.pathname || "/";
  for (const rule of disallows) {
    if (!rule) continue;
    if (rule === "/") {
      return { allowed: false, robotsUrl, detail: "Disallow: /" };
    }
    if (path === rule || path.startsWith(rule)) {
      return {
        allowed: false,
        robotsUrl,
        detail: `Disallow: ${rule}`,
      };
    }
  }
  return { allowed: true, robotsUrl };
}

/** Parse User-agent: * Disallow lines (ignore other agents). */
export function parseRobotsDisallows(body: string): string[] {
  const lines = body.split(/\r?\n/);
  const disallows: string[] = [];
  let inStar = false;
  for (const raw of lines) {
    const line = raw.replace(/#.*$/, "").trim();
    if (!line) continue;
    const ua = line.match(/^user-agent:\s*(.+)$/i);
    if (ua) {
      inStar = ua[1]!.trim() === "*";
      continue;
    }
    if (!inStar) continue;
    const dis = line.match(/^disallow:\s*(.*)$/i);
    if (dis) {
      const path = dis[1]!.trim();
      if (path) disallows.push(path);
    }
  }
  return disallows;
}

export async function fetchPageForAnalysis(
  url: string
): Promise<PageFetchResult> {
  const robots = await isPathAllowedByRobots(url);
  if (!robots.allowed) {
    return {
      url,
      status: "blocked_by_robots",
      detail: robots.detail ?? "blocked by robots.txt",
    };
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
    });
    clearTimeout(timer);

    if (!res.ok) {
      return {
        url,
        status: "failed",
        detail: `HTTP ${res.status}`,
      };
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (
      contentType &&
      !contentType.includes("text/html") &&
      !contentType.includes("text/plain") &&
      !contentType.includes("application/xhtml")
    ) {
      return {
        url,
        status: "failed",
        detail: `unsupported content-type ${contentType}`,
      };
    }

    const html = await res.text();
    const text = stripHtml(html).slice(0, MAX_EXCERPT_CHARS);
    if (text.length < 40) {
      return {
        url,
        status: "failed",
        detail: "page text too short after strip",
      };
    }

    return {
      url,
      status: "ok",
      textExcerpt: text,
      detail: robots.detail,
    };
  } catch (err) {
    return {
      url,
      status: "failed",
      detail: err instanceof Error ? err.message : "fetch failed",
    };
  }
}

/** Fetch up to `limit` unique sample URLs. */
export async function fetchTopPagesForAnalysis(
  sampleUrls: string[],
  limit = 3
): Promise<PageFetchResult[]> {
  const unique = [...new Set(sampleUrls)].slice(0, limit);
  const results: PageFetchResult[] = [];
  for (const url of unique) {
    results.push(await fetchPageForAnalysis(url));
  }
  return results;
}
