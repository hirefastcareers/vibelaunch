import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSitemapEntries } from "@/lib/seo/expander";

export const dynamic = "force-dynamic";

export async function GET() {
  const entries = await prisma.changelogEntry.findMany({
    where: { published: true },
    select: { slug: true, publishedAt: true },
    orderBy: { publishedAt: "desc" },
  });

  const baseUrl = process.env.APP_URL ?? "http://localhost:3000";
  const xml = generateSitemapEntries(baseUrl, entries);

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
