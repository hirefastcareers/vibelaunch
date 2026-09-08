import NextAuth from "next-auth";
import { NextRequest } from "next/server";
import { authOptions } from "@/lib/auth";
import { applyRequestAuthUrl } from "@/lib/env";

export const dynamic = "force-dynamic";

const authHandler = NextAuth(authOptions);

async function handler(req: NextRequest, context: unknown) {
  applyRequestAuthUrl(req.headers);
  return authHandler(req, context as never);
}

export { handler as GET, handler as POST };
