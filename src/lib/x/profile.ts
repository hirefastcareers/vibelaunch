import { prisma } from "@/lib/prisma";

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
