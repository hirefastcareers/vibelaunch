import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

export async function getSession() {
  try {
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
