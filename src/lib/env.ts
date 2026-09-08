const LOCAL_FALLBACK = "http://localhost:3000";

function firstNonEmpty(...values: Array<string | undefined>): string {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return "";
}

function normalizeOrigin(url: string): string {
  const trimmed = url.trim().replace(/\/$/, "");
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
}

export function isLocalUrl(url: string): boolean {
  try {
    const host = new URL(normalizeOrigin(url)).hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
  } catch {
    return false;
  }
}

function isVercelRuntime(): boolean {
  return process.env.VERCEL === "1";
}

/**
 * Resolve the app base URL with safe fallbacks for build time and Vercel deploys.
 * Treats empty env strings as unset (common when vars exist but have no value).
 * On Vercel, localhost NEXTAUTH_URL values are ignored so production login
 * does not send X back to the developer's laptop.
 */
export function getBaseUrl(): string {
  const candidates = [
    process.env.NEXTAUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.APP_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  ];

  for (const candidate of candidates) {
    const trimmed = candidate?.trim();
    if (!trimmed) continue;
    const origin = normalizeOrigin(trimmed);
    if (isVercelRuntime() && isLocalUrl(origin)) continue;
    return origin;
  }

  return LOCAL_FALLBACK;
}

export function getRequestOrigin(headerList: Headers): string | null {
  const host =
    headerList.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    headerList.get("host")?.split(",")[0]?.trim();
  if (!host) return null;

  const forwardedProto = headerList.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const hostname = host.replace(/:\d+$/, "").toLowerCase();
  const proto =
    forwardedProto ||
    (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]"
      ? "http"
      : "https");
  return `${proto}://${host}`.replace(/\/$/, "");
}

/**
 * Point NextAuth at the origin the browser actually used for this request.
 */
export function applyRequestAuthUrl(headerList: Headers): string {
  const origin = getRequestOrigin(headerList) ?? getBaseUrl();
  process.env.NEXTAUTH_URL = origin;
  if (!process.env.APP_URL?.trim() || (isVercelRuntime() && isLocalUrl(process.env.APP_URL))) {
    process.env.APP_URL = origin;
  }
  return origin;
}

/**
 * OAuth 2.0 Client ID / Secret from the X developer portal
 * (User authentication settings), not the API Key / API Key Secret.
 */
export function getXOauthCredentials(): { clientId: string; clientSecret: string } {
  return {
    clientId: firstNonEmpty(process.env.X_CLIENT_ID, process.env.TWITTER_CLIENT_ID),
    clientSecret: firstNonEmpty(
      process.env.X_CLIENT_SECRET,
      process.env.TWITTER_CLIENT_SECRET,
    ),
  };
}

export function isXOauthConfigured(): boolean {
  const { clientId, clientSecret } = getXOauthCredentials();
  return Boolean(clientId && clientSecret);
}

export const X_OAUTH_CALLBACK_PATH = "/api/auth/callback/twitter";

/**
 * The redirect_uri NextAuth sends to X. Must match a Callback URI in the
 * X developer portal character for character (no trailing slash).
 */
export function getXOauthCallbackUrl(baseUrl = getBaseUrl()): string {
  return `${baseUrl.replace(/\/$/, "")}${X_OAUTH_CALLBACK_PATH}`;
}

/**
 * Localhost and 127.0.0.1 are different origins to X. Register both when
 * developing locally so either host works.
 */
export function getXOauthCallbackAllowlist(baseUrl = getBaseUrl()): string[] {
  const primary = getXOauthCallbackUrl(baseUrl);
  const urls = new Set([primary]);
  try {
    const parsed = new URL(baseUrl);
    if (parsed.hostname === "localhost") {
      parsed.hostname = "127.0.0.1";
      urls.add(getXOauthCallbackUrl(parsed.origin));
    } else if (parsed.hostname === "127.0.0.1") {
      parsed.hostname = "localhost";
      urls.add(getXOauthCallbackUrl(parsed.origin));
    }
  } catch {
    // Ignore invalid base URLs; the primary callback is still useful.
  }
  return [...urls];
}

/**
 * Ensure NextAuth's required env vars are never empty strings during build/runtime.
 */
export function ensureAuthEnv(): void {
  const current = process.env.NEXTAUTH_URL?.trim();
  if (!current || (isVercelRuntime() && isLocalUrl(current))) {
    process.env.NEXTAUTH_URL = getBaseUrl();
  }
  if (!process.env.NEXTAUTH_SECRET?.trim()) {
    process.env.NEXTAUTH_SECRET =
      "xoopa-demo-secret-replace-in-production-32chars";
  }
  if (!process.env.APP_URL?.trim() || (isVercelRuntime() && isLocalUrl(process.env.APP_URL))) {
    process.env.APP_URL = getBaseUrl();
  }
}
