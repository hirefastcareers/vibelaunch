/**
 * SSRF guard for user-supplied alert webhook URLs.
 * Blocks localhost, private/link-local ranges, IPv4-mapped IPv6, and non-http(s).
 *
 * Note: hostname→IP resolution at fetch time is not done here (see deferred-work).
 * Callers should still prefer https and keep redirect: "error".
 */

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata",
]);

function isPrivateIpv4(host: string): boolean {
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

function isPrivateIpv6(host: string): boolean {
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
