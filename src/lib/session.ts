import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { applyRequestAuthUrl } from "./env";

export async function getSession() {
  try {
    applyRequestAuthUrl(await headers());
    return await getServerSession(authOptions);
  } catch (error) {
    console.error("[session] getServerSession failed", error);
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
