const LOCAL_FALLBACK = "http://localhost:3000";

/**
 * Resolve the app base URL with safe fallbacks for build time and Vercel deploys.
 * Treats empty env strings as unset (common when vars exist but have no value).
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
    if (trimmed) {
      return trimmed.replace(/\/$/, "");
    }
  }

  return LOCAL_FALLBACK;
}

/**
 * Ensure NextAuth's required env vars are never empty strings during build/runtime.
 */
export function ensureAuthEnv(): void {
  if (!process.env.NEXTAUTH_URL?.trim()) {
    process.env.NEXTAUTH_URL = getBaseUrl();
  }
  if (!process.env.NEXTAUTH_SECRET?.trim()) {
    process.env.NEXTAUTH_SECRET =
      "vibelaunch-demo-secret-replace-in-production-32chars";
  }
  if (!process.env.APP_URL?.trim()) {
    process.env.APP_URL = getBaseUrl();
  }
}
