import { NextRequest, NextResponse } from "next/server";
import { verifyQStashSignature } from "@/lib/queue/qstash";
import { captureSiteScreenshot } from "@/lib/media/site-capture";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const signature = req.headers.get("upstash-signature") ?? "";
  const body = await req.text();

  const isValid = await verifyQStashSignature(signature, body);
  if (!isValid && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: { projectId: string };
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (!payload.projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  const project = await prisma.project.findUnique({ where: { id: payload.projectId } });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  if (!project.websiteUrl) {
    return NextResponse.json({ error: "Project has no websiteUrl" }, { status: 400 });
  }

  try {
    const { blobUrl, capturedAt } = await captureSiteScreenshot(project.websiteUrl);
    const updated = await prisma.project.update({
      where: { id: project.id },
      data: {
        lastCaptureUrl: blobUrl,
        lastCapturedAt: capturedAt,
      },
    });

    return NextResponse.json({
      projectId: updated.id,
      lastCaptureUrl: updated.lastCaptureUrl,
      lastCapturedAt: updated.lastCapturedAt,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Capture failed" },
      { status: 500 }
    );
  }
}
