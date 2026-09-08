import { prisma } from "@/lib/prisma";
import { oauthExpiryUnix } from "@/lib/x/token";

type XAccount = {
  provider?: string | null;
  providerAccountId?: string | null;
} | null;

type XProfilePayload = {
  data?: { id?: string; username?: string };
  id?: string;
  username?: string;
  xUserId?: string;
  xUsername?: string | null;
};

export function extractXProfile(
  account: XAccount,
  profile: unknown,
): { xUserId: string; xUsername?: string } | null {
  if (account?.provider !== "twitter") return null;

  const raw = (profile ?? {}) as XProfilePayload;
  const xUserId =
    raw.xUserId ?? raw.data?.id ?? account.providerAccountId ?? raw.id;
  if (!xUserId) return null;

  const xUsername = raw.xUsername ?? raw.data?.username ?? raw.username;
  return { xUserId, xUsername: xUsername ?? undefined };
}

/**
 * NextAuth's signIn callback runs before Prisma creates the User on first login.
 * updateMany is a no-op when the row is missing, so it never aborts OAuth.
 */
export async function persistXUserProfile(
  userId: string | undefined,
  account: XAccount,
  profile: unknown,
): Promise<void> {
  if (!userId) return;
  const data = extractXProfile(account, profile);
  if (!data) return;

  await prisma.user.updateMany({
    where: { id: userId },
    data,
  });
}

type XOauthTokens = {
  provider?: string | null;
  access_token?: string | null;
  refresh_token?: string | null;
  expires_at?: number | null;
  expires_in?: number | null;
  token_type?: string | null;
  scope?: string | null;
} | null;

/**
 * NextAuth only writes Account tokens on first link. Later sign-ins create a
 * session and skip the token update, so Publish keeps using a dead refresh token.
 */
export async function persistXOauthTokens(
  userId: string | undefined,
  account: XOauthTokens,
): Promise<void> {
  if (!userId || account?.provider !== "twitter" || !account.access_token) return;

  const data: {
    access_token: string;
    expires_at: number | null;
    token_type: string;
    refresh_token?: string;
    scope?: string;
  } = {
    access_token: account.access_token,
    expires_at: oauthExpiryUnix({
      expires_at: account.expires_at,
      expires_in: account.expires_in,
    }),
    token_type: account.token_type ?? "bearer",
  };
  if (account.refresh_token) data.refresh_token = account.refresh_token;
  if (account.scope) data.scope = account.scope;

  await prisma.account.updateMany({
    where: { userId, provider: "twitter" },
    data,
  });
}
