import { prisma } from "@/lib/prisma";

const EMBEDDING_DIMENSIONS = 1536;

/**
 * Generate a text embedding via OpenAI.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // Deterministic fallback for dev/test without OpenAI
    return deterministicEmbedding(text);
  }

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Embedding API error: ${response.status}`);
  }

  const data = (await response.json()) as {
    data: Array<{ embedding: number[] }>;
  };
  return data.data[0].embedding;
}

/**
 * Store embedding for a post.
 */
export async function storePostEmbedding(
  postId: string,
  content: string,
  eriScore?: number
): Promise<void> {
  const embedding = await generateEmbedding(content);
  const vectorStr = `[${embedding.join(",")}]`;

  await prisma.$executeRawUnsafe(
    `INSERT INTO "PostEmbedding" (id, "postId", embedding, "eriScore", reinforced, "createdAt", "updatedAt")
     VALUES (gen_random_uuid()::text, $1, $2::vector, $3, false, NOW(), NOW())
     ON CONFLICT ("postId") DO UPDATE SET
       embedding = $2::vector,
       "eriScore" = COALESCE($3, "PostEmbedding"."eriScore"),
       "updatedAt" = NOW()`,
    postId,
    vectorStr,
    eriScore ?? null
  );
}

/**
 * Reinforce high-performing post embeddings (ERI > threshold).
 */
export async function reinforceHighPerformingEmbeddings(
  eriThreshold = 2.0
): Promise<number> {
  const highPerformers = await prisma.postAnalytics.findMany({
    where: { eri: { gte: eriThreshold } },
    include: { post: true },
  });

  let reinforced = 0;
  for (const analytics of highPerformers) {
    await storePostEmbedding(analytics.postId, analytics.post.content, analytics.eri);
    await prisma.postEmbedding.updateMany({
      where: { postId: analytics.postId },
      data: { reinforced: true, eriScore: analytics.eri },
    });
    reinforced++;
  }

  return reinforced;
}

/**
 * Find similar high-performing posts via vector similarity.
 */
export async function findSimilarPosts(
  query: string,
  limit = 5
): Promise<Array<{ postId: string; content: string; eriScore: number; similarity: number }>> {
  const embedding = await generateEmbedding(query);
  const vectorStr = `[${embedding.join(",")}]`;

  const results = await prisma.$queryRawUnsafe<
    Array<{ postId: string; content: string; eriScore: number; similarity: number }>
  >(
    `SELECT pe."postId", p.content, pe."eriScore",
            1 - (pe.embedding <=> $1::vector) AS similarity
     FROM "PostEmbedding" pe
     JOIN "Post" p ON p.id = pe."postId"
     WHERE pe.reinforced = true AND pe.embedding IS NOT NULL
     ORDER BY pe.embedding <=> $1::vector
     LIMIT $2`,
    vectorStr,
    limit
  );

  return results;
}

/** Deterministic pseudo-embedding for tests/dev without OpenAI. */
function deterministicEmbedding(text: string): number[] {
  const vec = new Array(EMBEDDING_DIMENSIONS).fill(0);
  for (let i = 0; i < text.length; i++) {
    vec[i % EMBEDDING_DIMENSIONS] += text.charCodeAt(i) / 255;
  }
  const magnitude = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / magnitude);
}
