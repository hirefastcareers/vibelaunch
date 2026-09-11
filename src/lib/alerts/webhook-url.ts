/**
 * SSRF guard for user-supplied alert webhook URLs.
 * Blocks localhost, private/link-local ranges, IPv4-mapped IPv6, and non-http(s).
 *
 * Save-time validation checks the URL string; deliver-time also re-resolves DNS
 * so a hostname that later points at a private IP is rejected (DNS rebinding).
 */

import { lookup } from "node:dns/promises";
import type { LookupAddress } from "node:dns";

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata",
]);

export function isPrivateIpv4(host: string): boolean {
  const m = host.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (!m) return false;
  const a = Number(m[1]);
  const b = Number(m[2]);
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  return false;
}

export function isPrivateIpv6(host: string): boolean {
  const h = host.toLowerCase();
  if (h === "::1") return true;
  if (h.startsWith("fc") || h.startsWith("fd")) return true; // ULA
  if (h.startsWith("fe80")) return true; // link-local
  // IPv4-mapped IPv6: ::ffff:127.0.0.1 or ::ffff:7f00:1
  const mapped = h.match(/^::ffff:(.+)$/);
  if (mapped) {
    const embedded = mapped[1];
    if (isPrivateIpv4(embedded)) return true;
    // dotted-hex form ::ffff:7f00:1 → treat as private if first hextet is 7fxx / 0a00 / etc.
    const hexParts = embedded.split(":");
    if (hexParts.length === 2) {
      const hi = parseInt(hexParts[0], 16);
      if (Number.isFinite(hi)) {
        const a = (hi >> 8) & 0xff;
        const b = hi & 0xff;
        if (a === 10 || a === 127 || a === 0) return true;
        if (a === 169 && b === 254) return true;
        if (a === 172 && b >= 16 && b <= 31) return true;
        if (a === 192 && b === 168) return true;
        if (a === 100 && b >= 64 && b <= 127) return true;
      }
    }
  }
  return false;
}

export function isPrivateOrBlockedIp(address: string): boolean {
  const host = address.replace(/^\[|\]$/g, "").toLowerCase();
  return isPrivateIpv4(host) || isPrivateIpv6(host);
}

function normalizeHostname(hostname: string): string {
  return hostname
    .toLowerCase()
    .replace(/^\[|\]$/g, "")
    .replace(/\.$/, ""); // trailing-dot FQDN (localhost.)
}

export type WebhookUrlValidation =
  | { ok: true; url: string }
  | { ok: false; error: string };

export function validateAlertWebhookUrl(raw: string): WebhookUrlValidation {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, error: "Webhook URL is empty" };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, error: "Webhook URL is not a valid URL" };
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return { ok: false, error: "Webhook URL must use http or https" };
  }

  const host = normalizeHostname(parsed.hostname);
  if (
    BLOCKED_HOSTNAMES.has(host) ||
    host.endsWith(".localhost") ||
    host.endsWith(".local")
  ) {
    return { ok: false, error: "Webhook URL host is not allowed" };
  }
  if (isPrivateIpv4(host) || isPrivateIpv6(host)) {
    return { ok: false, error: "Webhook URL must not target a private network" };
  }

  return { ok: true, url: parsed.toString() };
}

export type ResolveWebhookDns = (
  hostname: string
) => Promise<LookupAddress[]>;

/**
 * Re-resolve hostname and reject if any address is private/loopback/link-local.
 * Call immediately before fetch to mitigate DNS rebinding after save-time checks.
 */
export async function assertWebhookDnsSafe(
  urlString: string,
  resolveDns: ResolveWebhookDns = defaultResolveDns
): Promise<WebhookUrlValidation> {
  const validated = validateAlertWebhookUrl(urlString);
  if (!validated.ok) return validated;

  const parsed = new URL(validated.url);
  const host = normalizeHostname(parsed.hostname);

  // Literal IPs already covered by validateAlertWebhookUrl — still re-check.
  if (isPrivateIpv4(host) || isPrivateIpv6(host)) {
    return {
      ok: false,
      error: "Webhook URL must not target a private network",
    };
  }

  let addresses: LookupAddress[];
  try {
    addresses = await resolveDns(host);
  } catch (err) {
    return {
      ok: false,
      error: `Webhook DNS lookup failed (${err instanceof Error ? err.message : "error"})`,
    };
  }

  if (!addresses.length) {
    return { ok: false, error: "Webhook DNS lookup returned no addresses" };
  }

  for (const row of addresses) {
    if (isPrivateOrBlockedIp(row.address)) {
      return {
        ok: false,
        error: `Webhook resolved to a private or blocked address (${row.address})`,
      };
    }
  }

  return { ok: true, url: validated.url };
}

async function defaultResolveDns(hostname: string): Promise<LookupAddress[]> {
  // family:0 → both A and AAAA when available
  const result = await lookup(hostname, { all: true, verbatim: true });
  return result;
}
