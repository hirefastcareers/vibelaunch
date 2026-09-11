/**
 * Phase 11 — normalize citation hosts for aggregation.
 * Strips www only. Does not collapse arbitrary subdomains (no PSL dependency).
 */

export function normalizeCitationDomain(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let candidate = trimmed;
  if (!/^https?:\/\//i.test(candidate)) {
    if (candidate.includes(" ") || !candidate.includes(".")) return null;
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
  if (!host || !host.includes(".")) return null;
  return host;
}

export type DomainTally = {
  domain: string;
  count: number;
  models: string[];
  sampleUrls: string[];
};

/**
 * Aggregate cited URLs into domain tallies (count + models + sample URLs).
 */
export function aggregateCitedDomains(
  entries: Array<{ url: string; model: string }>
): DomainTally[] {
  const map = new Map<
    string,
    { count: number; models: Set<string>; sampleUrls: string[] }
  >();

  for (const entry of entries) {
    const domain = normalizeCitationDomain(entry.url);
    if (!domain) continue;
    let row = map.get(domain);
    if (!row) {
      row = { count: 0, models: new Set(), sampleUrls: [] };
      map.set(domain, row);
    }
    row.count += 1;
    row.models.add(entry.model);
    if (row.sampleUrls.length < 3 && !row.sampleUrls.includes(entry.url)) {
      row.sampleUrls.push(entry.url);
    }
  }

  return [...map.entries()]
    .map(([domain, row]) => ({
      domain,
      count: row.count,
      models: [...row.models].sort(),
      sampleUrls: row.sampleUrls,
    }))
    .sort((a, b) => b.count - a.count || a.domain.localeCompare(b.domain));
}

/** Stable fingerprint of the top-N domain set (order-insensitive). */
export function domainsFingerprint(
  tallies: DomainTally[],
  topN = 5
): string {
  return tallies
    .slice(0, topN)
    .map((t) => t.domain)
    .sort()
    .join("|");
}

/** True when the top-N domain *set* changed (counts alone do not invalidate). */
export function domainsChangedMeaningfully(
  previousFingerprint: string,
  nextTallies: DomainTally[],
  topN = 5
): boolean {
  return previousFingerprint !== domainsFingerprint(nextTallies, topN);
}
