import { NextRequest, NextResponse } from "next/server";
import { verifyQStashSignature } from "@/lib/queue/qstash";
import { publishToX } from "@/lib/x/publish";
import { prisma } from "@/lib/prisma";
import { storePostEmbedding } from "@/lib/vector/embeddings";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("upstash-signature") ?? "";
  const body = await req.text();

  const isValid = await verifyQStashSignature(signature, body);
  if (!isValid && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: { postId: string; projectId: string; userId: string };
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const post = await prisma.post.findUnique({ where: { id: payload.postId } });
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  await prisma.post.update({
    where: { id: post.id },
    data: { status: "PUBLISHING" },
  });

  try {
    const result = await publishToX(payload.userId, post.content, post.mediaUrls);

    const updated = await prisma.post.update({
      where: { id: post.id },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
        xPostId: result.id,
        xPostUrl: result.url,
      },
    });

    // Store embedding for vector reinforcement pipeline
    try {
      await storePostEmbedding(post.id, post.content);
    } catch {
      // Non-fatal: embedding storage can fail without blocking publish
    }

    return NextResponse.json({ post: updated });
  } catch (err) {
    await prisma.post.update({
      where: { id: post.id },
      data: {
        status: "FAILED",
        errorMessage: err instanceof Error ? err.message : String(err),
      },
    });

    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Publish failed" },
      { status: 500 }
    );
  }
}
