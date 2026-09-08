import { prisma } from "@/lib/prisma";
import { findSimilarPosts } from "@/lib/vector/embeddings";
import {
  buildFallbackPost,
  buildPostPrompt,
  cleanGeneratedPost,
} from "./post-voice";

export interface GeneratedContent {
  content: string;
  tone: string;
  inspiredBy: string[];
}

/**
 * Adaptive content generator: uses vector-reinforced high-ERI posts as inspiration.
 */
export async function generateAdaptiveContent(
  projectId: string,
  topic: string,
  tone: "professional" | "casual" | "hype" | "technical" = "casual"
): Promise<GeneratedContent> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { name: true, tagline: true, description: true },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  const similarPosts = await findSimilarPosts(topic, 3);
  const inspiredBy = similarPosts.map((p) => p.postId);

  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    return generateWithOpenAI(project, topic, tone, similarPosts);
  }

  return generateFallback(project, topic, tone, similarPosts);
}

async function generateWithOpenAI(
  project: { name: string; tagline: string | null; description: string | null },
  topic: string,
  tone: string,
  similarPosts: Array<{ content: string; eriScore: number }>
): Promise<GeneratedContent> {
  const examples = similarPosts
    .map((p) => `- (ERI ${p.eriScore}): "${p.content}"`)
    .join("\n");

  const prompt = buildPostPrompt({
    name: project.name,
    tagline: project.tagline,
    description: project.description,
    topic,
    tone,
    examples,
  });

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 120,
      temperature: 0.4,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI error: ${response.status}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };

  const content = cleanGeneratedPost(data.choices[0].message.content);

  return {
    content,
    tone,
    inspiredBy: similarPosts.map((_, i) => `similar-${i}`),
  };
}

function generateFallback(
  project: { name: string; tagline: string | null; description?: string | null },
  topic: string,
  tone: string,
  similarPosts: Array<{ postId: string }>
): GeneratedContent {
  return {
    content: buildFallbackPost(project, topic),
    tone,
    inspiredBy: similarPosts.map((p) => p.postId),
  };
}
