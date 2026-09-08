import { cookies, headers } from "next/headers";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";
import { applyRequestAuthUrl } from "./env";
import { prisma } from "./prisma";

const SESSION_COOKIE_NAMES = [
  "__Secure-next-auth.session-token",
  "__Host-next-auth.session-token",
  "next-auth.session-token",
];

async function getSessionFromDatabaseCookie() {
  const store = await cookies();
  let sessionToken: string | undefined;
  for (const name of SESSION_COOKIE_NAMES) {
    sessionToken = store.get(name)?.value;
    if (sessionToken) break;
  }
  if (!sessionToken) return null;

  const dbSession = await prisma.session.findUnique({
    where: { sessionToken },
    include: { user: true },
  });
  if (!dbSession || dbSession.expires < new Date()) return null;

  return {
    user: {
      id: dbSession.user.id,
      name: dbSession.user.name,
      email: dbSession.user.email,
      image: dbSession.user.image,
      xUsername: dbSession.user.xUsername ?? undefined,
    },
    expires: dbSession.expires.toISOString(),
  };
}

export async function getSession() {
  try {
    try {
      applyRequestAuthUrl(await headers());
    } catch {
      // Request origin is optional for reading an existing session.
    }
    const session = await getServerSession(authOptions);
    if (session?.user?.id) return session;
  } catch (error) {
    console.error("[session] getServerSession failed", error);
  }

  try {
    return await getSessionFromDatabaseCookie();
  } catch (error) {
    console.error("[session] cookie fallback failed", error);
    return null;
  }
}

export async function requireAuth() {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session;
}
