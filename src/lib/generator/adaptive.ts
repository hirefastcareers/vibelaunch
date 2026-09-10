import { prisma } from "@/lib/prisma";
import { findSimilarPosts } from "@/lib/vector/embeddings";
import { isFeatureEnabled, logFeatureSkip } from "@/lib/feature-flags";
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
 * Adaptive content generator.
 * When ERI inspiration is flagged off, drafts from product context only (GEO-oriented prompts).
 */
export async function generateAdaptiveContent(
  projectId: string,
  topic: string,
  tone: "professional" | "casual" | "hype" | "technical" = "casual"
): Promise<GeneratedContent> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { name: true, tagline: true, description: true, keywords: true },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  let similarPosts: Array<{ postId: string; content: string; eriScore: number }> = [];
  if (isFeatureEnabled("ERI_INSPIRED_GENERATION")) {
    similarPosts = await findSimilarPosts(topic, 3);
  } else {
    logFeatureSkip(
      "ERI_INSPIRED_GENERATION",
      "belongs to X-growth scope, not Xoopa GEO focus"
    );
  }

  const inspiredBy = similarPosts.map((p) => p.postId);

  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    return generateWithOpenAI(project, topic, tone, similarPosts);
  }

  return generateFallback(project, topic, tone, similarPosts);
}

async function generateWithOpenAI(
  project: {
    name: string;
    tagline: string | null;
    description: string | null;
    keywords: string[];
  },
  topic: string,
  tone: string,
  similarPosts: Array<{ content: string; eriScore: number }>
): Promise<GeneratedContent> {
  const useEriExamples = isFeatureEnabled("ERI_INSPIRED_GENERATION");
  const examples = similarPosts
    .map((p) =>
      useEriExamples
        ? `- (ERI ${p.eriScore}): "${p.content}"`
        : `- "${p.content}"`
    )
    .join("\n");

  const prompt = buildPostPrompt({
    name: project.name,
    tagline: project.tagline,
    description: project.description,
    topic,
    tone,
    examples,
    trackedQueries: project.keywords,
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
