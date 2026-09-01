import { prisma } from "@/lib/prisma";
import { findSimilarPosts } from "@/lib/vector/embeddings";

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

  const prompt = `Generate a single X/Twitter post (max 280 chars) for the product "${project.name}".
Tagline: ${project.tagline ?? "N/A"}
Topic: ${topic}
Tone: ${tone}

High-performing past posts for inspiration:
${examples || "No examples yet - write something engaging."}

Return ONLY the post text, no quotes or explanation.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 100,
      temperature: 0.8,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI error: ${response.status}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };

  const content = data.choices[0].message.content.trim().slice(0, 280);

  return {
    content,
    tone,
    inspiredBy: similarPosts.map((_, i) => `similar-${i}`),
  };
}

function generateFallback(
  project: { name: string; tagline: string | null },
  topic: string,
  tone: string,
  similarPosts: Array<{ postId: string; content: string }>
): GeneratedContent {
  const templates: Record<string, string> = {
    professional: `Excited to share an update on ${topic} for ${project.name}. ${project.tagline ?? ""}`.trim(),
    casual: `Just shipped something cool for ${project.name} - ${topic}! 🚀`,
    hype: `🔥 ${project.name} just leveled up! ${topic} is HERE. Don't sleep on this.`,
    technical: `New in ${project.name}: ${topic}. Built for developers who care about quality.`,
  };

  const content = (templates[tone] ?? templates.casual).slice(0, 280);

  return {
    content,
    tone,
    inspiredBy: similarPosts.map((p) => p.postId),
  };
}
