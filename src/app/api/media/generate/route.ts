import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const generateSchema = z.object({
  type: z.enum(["video", "code-card"]),
  url: z.string().url().optional(),
  code: z.string().optional(),
  language: z.string().optional(),
  title: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = generateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { type, url, code, language, title } = parsed.data;

  if (type === "video") {
    if (!url) {
      return NextResponse.json({ error: "url required for video" }, { status: 400 });
    }
    const { recordSiteVideo } = await import("@/lib/media/video-recorder");
    const result = await recordSiteVideo({ url });
    return NextResponse.json({ type: "video", ...result });
  }

  if (!code) {
    return NextResponse.json({ error: "code required for code-card" }, { status: 400 });
  }

  const { renderCodeCard } = await import("@/lib/media/code-card");
  const result = await renderCodeCard({ code, language, title });
  return NextResponse.json({ type: "code-card", ...result });
}

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type") ?? "video";
  const id = req.nextUrl.searchParams.get("id") ?? "default";

  const svg = type === "code-card"
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
        <rect fill="#0f172a" width="1200" height="630"/>
        <text x="60" y="80" fill="#a78bfa" font-family="monospace" font-size="24">// Code Card Preview</text>
        <text x="60" y="140" fill="#e2e8f0" font-family="monospace" font-size="18">${id}</text>
      </svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
        <rect fill="#0f172a" width="640" height="360"/>
        <circle cx="320" cy="180" r="40" fill="none" stroke="#a78bfa" stroke-width="4"/>
        <polygon points="310,165 310,195 335,180" fill="#a78bfa"/>
        <text x="320" y="260" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="14">Video Preview</text>
      </svg>`;

  return new NextResponse(svg, {
    headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=3600" },
  });
}
