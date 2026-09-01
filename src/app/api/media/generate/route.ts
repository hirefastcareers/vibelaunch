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
        <defs>
          <pattern id="ds-stripe" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
            <rect width="6" height="12" fill="#E0DCD3"/>
          </pattern>
        </defs>
        <rect fill="#FAF8F4" width="1200" height="630"/>
        <rect fill="url(#ds-stripe)" width="1200" height="630"/>
        <rect x="588" y="278" width="8" height="8" fill="#FF5500"/>
        <text x="600" y="328" text-anchor="middle" fill="#171512" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" letter-spacing="2.2">CODE CARD PLACEHOLDER</text>
        <text x="600" y="352" text-anchor="middle" fill="#6B655C" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="11" letter-spacing="1.6">${id}</text>
      </svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
        <defs>
          <pattern id="ds-stripe" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
            <rect width="6" height="12" fill="#E0DCD3"/>
          </pattern>
        </defs>
        <rect fill="#FAF8F4" width="640" height="360"/>
        <rect fill="url(#ds-stripe)" width="640" height="360"/>
        <rect x="316" y="148" width="8" height="8" fill="#FF5500"/>
        <text x="320" y="186" text-anchor="middle" fill="#171512" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="12" letter-spacing="2.2">VIDEO PLACEHOLDER</text>
        <text x="320" y="208" text-anchor="middle" fill="#6B655C" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="10" letter-spacing="1.6">${id}</text>
      </svg>`;

  return new NextResponse(svg, {
    headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=3600" },
  });
}
