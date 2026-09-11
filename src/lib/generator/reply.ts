import { withDirectProseInstruction } from "@/lib/ai/prose-style";

export interface ReplyProjectContext {
  name: string;
  tagline?: string | null;
  description?: string | null;
  tone?: string | null;
}

/**
 * Draft a short, non-spammy X reply. Uses OpenAI when keyed; otherwise a
 * tone-aware fallback so the inbox stays usable without inventing fake posts.
 */
export async function generateSmartReply(
  originalPost: string,
  options: {
    keyword?: string;
    project?: ReplyProjectContext | null;
  } = {}
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (apiKey) {
    try {
      return await generateWithOpenAI(originalPost, options, apiKey);
    } catch (error) {
      console.error("[replies] OpenAI generate failed", error);
    }
  }
  return generateFallbackReply(originalPost, options);
}

async function generateWithOpenAI(
  originalPost: string,
  options: {
    keyword?: string;
    project?: ReplyProjectContext | null;
  },
  apiKey: string
): Promise<string> {
  const project = options.project;
  const productLine = project
    ? `Product context: ${project.name}${
        project.tagline ? ` (${project.tagline})` : ""
      }${project.description ? `. ${project.description.slice(0, 240)}` : ""}`
    : "No product context provided.";

  const prompt = withDirectProseInstruction(`Write a helpful, non-spammy X/Twitter reply (max 260 characters) to this post:

"${originalPost.slice(0, 500)}"

Monitoring: ${options.keyword ?? "relevant conversations"}.
${productLine}
Tone: ${project?.tone ?? "warm and specific"}.

Rules:
- Be genuine and add value. Ask a sharp question or share a concrete observation.
- Do not hard-sell. Mention the product only if it fits naturally in one short clause.
- No hashtags spam, no "check out my tool", no links.
- Return ONLY the reply text.`);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 120,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI error: ${response.status}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };

  return cleanReply(data.choices[0]?.message?.content ?? "");
}

export function generateFallbackReply(
  originalPost: string,
  options: {
    keyword?: string;
    project?: ReplyProjectContext | null;
  } = {}
): string {
  const lower = originalPost.toLowerCase();
  const name = options.project?.name;

  if (lower.includes("mrr") || lower.includes("revenue") || lower.includes("arr")) {
    return "Congrats on the milestone. Curious what the biggest lever was once things started compounding?";
  }
  if (lower.includes("launch") || lower.includes("shipped") || lower.includes("shipping")) {
    return name
      ? `Love seeing this ship. We just pushed a similar update on ${name}. What are you watching for feedback?`
      : "Love seeing this ship. What signal are you watching first for whether it landed?";
  }
  if (
    options.keyword?.toLowerCase().includes("vibecod") ||
    lower.includes("vibe cod") ||
    lower.includes("vibecod")
  ) {
    return "Agreed. AI scaffolds fast, but tests and review are what make it production-ready.";
  }
  if (
    options.keyword?.toLowerCase().includes("saas") ||
    lower.includes("micro-saas") ||
    lower.includes("indie")
  ) {
    return "Focused problem plus simple pricing keeps winning. What niche are you locking onto next?";
  }
  if (lower.includes("?")) {
    return name
      ? `Good question. From building ${name}, the pattern that helped most was shipping small and measuring one metric hard.`
      : "Good question. The pattern that helps most is shipping small and measuring one metric hard.";
  }

  return name
    ? `Really clear write-up. Resonates with what we are seeing while building ${name}.`
    : "Really clear write-up. Thanks for sharing this so openly.";
}

function cleanReply(raw: string): string {
  return raw
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\s+/g, " ")
    .slice(0, 280);
}
