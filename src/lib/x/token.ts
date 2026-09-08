import { prisma } from "@/lib/prisma";
import { getXOauthCredentials } from "@/lib/env";

export class XAuthError extends Error {
  constructor(
    message: string,
    public code: "NO_ACCOUNT" | "REFRESH_FAILED" | "REAUTH_REQUIRED"
  ) {
    super(message);
    this.name = "XAuthError";
  }
}

const REFRESH_SKEW_SECONDS = 5 * 60;
const UNIX_EXPIRY_FLOOR = 1_000_000_000;
const UNIX_MS_FLOOR = 1_000_000_000_000;
const REAUTH_MESSAGE =
  "X needs a fresh login before it can post. Sign out, then Sign in with X, and try Publish again.";

interface TokenRefreshResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
}

/** NextAuth sometimes stores expires_in (e.g. 7200) instead of a unix timestamp. */
export function isUnixExpiry(expiresAt: number | null | undefined): boolean {
  return expiresAt != null && expiresAt >= UNIX_EXPIRY_FLOOR && expiresAt < UNIX_MS_FLOOR;
}

export function oauthExpiryUnix(input: {
  expires_at?: number | null;
  expires_in?: number | null;
}): number | null {
  const expiresAt = input.expires_at ?? null;
  if (expiresAt != null && expiresAt >= UNIX_MS_FLOOR) {
    return Math.floor(expiresAt / 1000);
  }
  if (isUnixExpiry(expiresAt)) return expiresAt;
  if (input.expires_in && input.expires_in > 0 && input.expires_in < UNIX_EXPIRY_FLOOR) {
    return Math.floor(Date.now() / 1000) + input.expires_in;
  }
  if (expiresAt && expiresAt > 0 && expiresAt < UNIX_EXPIRY_FLOOR) {
    return Math.floor(Date.now() / 1000) + expiresAt;
  }
  return null;
}

/**
 * Return a usable X OAuth2 access token, refreshing when expires_at is near or past.
 */
export async function getValidAccessToken(userId: string): Promise<string> {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "twitter" },
  });

  if (!account?.access_token) {
    throw new XAuthError("X account not connected", "NO_ACCOUNT");
  }

  const now = Math.floor(Date.now() / 1000);
  const needsRefresh =
    isUnixExpiry(account.expires_at) &&
    account.expires_at! <= now + REFRESH_SKEW_SECONDS;

  if (!needsRefresh) {
    return account.access_token;
  }

  if (!account.refresh_token) {
    throw new XAuthError(REAUTH_MESSAGE, "REAUTH_REQUIRED");
  }

  const { clientId, clientSecret } = getXOauthCredentials();
  if (!clientId || !clientSecret) {
    throw new XAuthError(
      "X token refresh failed: missing client credentials",
      "REFRESH_FAILED"
    );
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch("https://api.x.com/2/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: account.refresh_token,
      client_id: clientId,
    }),
  });

  const body = await response.text();
  if (!response.ok) {
    console.error("[x-token] refresh failed", response.status, body);
    throw new XAuthError(REAUTH_MESSAGE, "REAUTH_REQUIRED");
  }

  let data: TokenRefreshResponse;
  try {
    data = JSON.parse(body) as TokenRefreshResponse;
  } catch {
    console.error("[x-token] refresh returned non-JSON", response.status, body);
    throw new XAuthError(REAUTH_MESSAGE, "REAUTH_REQUIRED");
  }

  if (!data.access_token || typeof data.expires_in !== "number") {
    console.error("[x-token] refresh missing access_token", body);
    throw new XAuthError(REAUTH_MESSAGE, "REAUTH_REQUIRED");
  }

  await prisma.account.update({
    where: { id: account.id },
    data: {
      access_token: data.access_token,
      refresh_token: data.refresh_token ?? account.refresh_token,
      expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
    },
  });

  return data.access_token;
}
