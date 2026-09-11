/**
 * Phase 10 — normalize published / cited URLs so later matching is reliable.
 * Strips tracking params, trailing slashes, forces https, drops www.
 */

const TRACKING_PARAM_EXACT = new Set([
  "fbclid",
  "gclid",
  "gbraid",
  "wbraid",
  "msclkid",
  "mc_cid",
  "mc_eid",
  "igshid",
  "ref",
  "ref_src",
  "source",
  "src",
  "si",
]);

function isTrackingParam(key: string): boolean {
  const lower = key.toLowerCase();
  if (TRACKING_PARAM_EXACT.has(lower)) return true;
  if (lower.startsWith("utm_")) return true;
  if (lower.startsWith("hsa_")) return true;
  if (lower.startsWith("pk_")) return true;
  return false;
}

export type NormalizedUrlParts = {
  /** https://host/path?sortedNonTrackingQuery (no trailing slash except root) */
  canonical: string;
  host: string;
  path: string;
};

/**
 * Parse and normalize a URL for citation matching.
 * Returns null when the string is not a usable absolute http(s) URL.
 */
export function normalizePublishedUrl(raw: string): NormalizedUrlParts | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let candidate = trimmed;
  // Reject known non-http schemes before the bare-host https:// fallback.
  if (/^[a-z][a-z0-9+.-]*:/i.test(candidate) && !/^https?:\/\//i.test(candidate)) {
    return null;
  }
  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `https://${candidate}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return null;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return null;
  }

  let host = parsed.hostname.toLowerCase();
  if (host.startsWith("www.")) {
    host = host.slice(4);
  }
  if (!host) return null;

  let path = parsed.pathname || "/";
  // Collapse duplicate slashes; drop trailing slash except for root.
  path = path.replace(/\/{2,}/g, "/");
  if (path.length > 1 && path.endsWith("/")) {
    path = path.slice(0, -1);
  }
  // Decode then re-encode pathname segments lightly via URL reconstrution.
  path = path.toLowerCase();

  const kept = new URLSearchParams();
  const entries: Array<[string, string]> = [];
  parsed.searchParams.forEach((value, key) => {
    if (isTrackingParam(key)) return;
    entries.push([key, value]);
  });
  entries.sort(([a], [b]) => a.localeCompare(b));
  for (const [key, value] of entries) {
    kept.append(key, value);
  }
  const query = kept.toString();

  const canonical = `https://${host}${path}${query ? `?${query}` : ""}`;
  return { canonical, host, path };
}

export type UrlMatchKind = "EXACT" | "DOMAIN";

/**
 * Compare a published URL against one cited URL.
 * EXACT = same normalized host + path (query ignored for match equality beyond
 * what normalize kept). DOMAIN = same host only.
 */
export function matchPublishedAgainstCited(
  published: NormalizedUrlParts,
  citedRaw: string
): UrlMatchKind | null {
  const cited = normalizePublishedUrl(citedRaw);
  if (!cited) return null;
  if (cited.host !== published.host) return null;
  if (cited.path === published.path) return "EXACT";
  return "DOMAIN";
}

/**
 * Best match of published URL against a list of cited URLs.
 * Prefers EXACT over DOMAIN; returns null when neither applies.
 * Does not conflate: callers that only want domain-when-no-exact should use this.
 */
export function bestMatchAgainstCitedUrls(
  publishedRaw: string,
  citedUrls: string[]
): UrlMatchKind | null {
  const published = normalizePublishedUrl(publishedRaw);
  if (!published) return null;

  let sawDomain = false;
  for (const cited of citedUrls) {
    const kind = matchPublishedAgainstCited(published, cited);
    if (kind === "EXACT") return "EXACT";
    if (kind === "DOMAIN") sawDomain = true;
  }
  return sawDomain ? "DOMAIN" : null;
}
