import { prisma } from "@/lib/prisma";
import { enqueuePost } from "@/lib/queue/qstash";
import { storePostEmbedding } from "@/lib/vector/embeddings";
import { publishToX, XApiError, XAuthError } from "@/lib/x/publish";

function formatPublishError(err: unknown): string {
  if (err instanceof XAuthError) {
    return `[AUTH:${err.code}] ${err.message}`;
  }
  if (err instanceof XApiError) {
    return `[API:${err.status}] ${err.message}`;
  }
  return err instanceof Error ? err.message : String(err);
}

export function hasQStash(): boolean {
  return Boolean(process.env.QSTASH_TOKEN?.trim());
}

export async function dispatchPostPublish(input: {
  postId: string;
  projectId: string;
  userId: string;
  content: string;
  mediaUrls: string[];
  scheduledAt: Date | null;
}): Promise<{ mode: "queued" | "published"; post: { id: string; status: string } }> {
  const isFuture =
    input.scheduledAt != null && input.scheduledAt.getTime() > Date.now();

  if (isFuture && !hasQStash()) {
    throw new Error("Scheduled posts require QSTASH_TOKEN");
  }

  if (hasQStash() || isFuture) {
    const jobId = await enqueuePost(
      {
        postId: input.postId,
        projectId: input.projectId,
        userId: input.userId,
      },
      isFuture && input.scheduledAt ? { notBefore: input.scheduledAt } : undefined,
    );

    const post = await prisma.post.update({
      where: { id: input.postId },
      data: { status: "QUEUED", queueJobId: jobId, errorMessage: null },
    });
    return { mode: "queued", post };
  }

  await prisma.post.update({
    where: { id: input.postId },
    data: { status: "PUBLISHING", errorMessage: null },
  });

  try {
    const result = await publishToX(input.userId, input.content, input.mediaUrls);
    const post = await prisma.post.update({
      where: { id: input.postId },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
        xPostId: result.id,
        xPostUrl: result.url,
        errorMessage: null,
      },
    });
    try {
      await storePostEmbedding(input.postId, input.content);
    } catch {
      // Non-fatal: embedding storage can fail without blocking publish
    }
    return { mode: "published", post };
  } catch (err) {
    const errorMessage = formatPublishError(err);
    await prisma.post.update({
      where: { id: input.postId },
      data: { status: "FAILED", errorMessage },
    });
    throw err;
  }
}
