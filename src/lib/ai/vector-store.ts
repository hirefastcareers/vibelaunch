export { reinforceHighPerformingEmbeddings, findSimilarPosts, storePostEmbedding, generateEmbedding } from "@/lib/vector/embeddings";

export async function queryVectorStore(
  query: string,
  limit = 5
): Promise<Array<{ postId: string; content: string; eriScore: number; similarity: number }>> {
  const { findSimilarPosts } = await import("@/lib/vector/embeddings");
  return findSimilarPosts(query, limit);
}
