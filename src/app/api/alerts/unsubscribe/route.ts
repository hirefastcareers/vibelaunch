import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * One-click unsubscribe — sets digest frequency to OFF.
 * No auth cookie required; token is the capability.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")?.trim();
  if (!token) {
    return new NextResponse("Missing unsubscribe token", { status: 400 });
  }

  const pref = await prisma.alertPreference.findFirst({
    where: { unsubscribeToken: token },
  });
  if (!pref) {
    return new NextResponse("Invalid or expired unsubscribe link", {
      status: 404,
    });
  }

  await prisma.alertPreference.update({
    where: { id: pref.id },
    data: { digestFrequency: "OFF" },
  });

  return new NextResponse(
    "You are unsubscribed from Xoopa citation alert emails. You can re-enable digests any time under Dashboard → Alert settings.",
    {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    }
  );
}
