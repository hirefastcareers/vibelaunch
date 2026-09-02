import { prisma } from "@/lib/prisma";

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

interface TokenRefreshResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
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
    account.expires_at != null && account.expires_at <= now + REFRESH_SKEW_SECONDS;

  if (!needsRefresh) {
    return account.access_token;
  }

  if (!account.refresh_token) {
    throw new XAuthError(
      "X session expired and cannot be refreshed automatically",
      "REAUTH_REQUIRED"
    );
  }

  const clientId = process.env.X_CLIENT_ID;
  const clientSecret = process.env.X_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new XAuthError(
      "X token refresh failed: missing client credentials",
      "REFRESH_FAILED"
    );
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: account.refresh_token,
    }),
  });

  const body = await response.text();
  if (!response.ok) {
    throw new XAuthError(
      `X token refresh failed: ${response.status} ${body}`,
      "REAUTH_REQUIRED"
    );
  }

  let data: TokenRefreshResponse;
  try {
    data = JSON.parse(body) as TokenRefreshResponse;
  } catch {
    throw new XAuthError(
      `X token refresh failed: ${response.status} ${body}`,
      "REAUTH_REQUIRED"
    );
  }

  if (!data.access_token || typeof data.expires_in !== "number") {
    throw new XAuthError(
      `X token refresh failed: ${response.status} ${body}`,
      "REAUTH_REQUIRED"
    );
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
