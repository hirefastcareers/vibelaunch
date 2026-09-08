export interface ReplyContext {
  originalPost: string;
  keyword?: string;
  projectName?: string;
  projectTagline?: string | null;
  projectDescription?: string | null;
  tone?: string | null;
}

/**
 * Draft a warm, non-spammy X reply. Uses OpenAI when available;
 * otherwise a short heuristic fallback.
 */
export async function generateSmartReply(ctx: ReplyContext): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (apiKey) {
    try {
      const reply = await generateWithOpenAI(apiKey, ctx);
      if (reply) return reply;
    } catch (error) {
      console.error("[replies] OpenAI generate failed", error);
    }
  }

  return generateFallbackReply(ctx.originalPost, ctx.keyword);
}

async function generateWithOpenAI(
  apiKey: string,
  ctx: ReplyContext
): Promise<string | null> {
  const projectBits = [
    ctx.projectName ? `Product: ${ctx.projectName}` : null,
    ctx.projectTagline ? `Tagline: ${ctx.projectTagline}` : null,
    ctx.projectDescription
      ? `About: ${ctx.projectDescription.slice(0, 240)}`
      : null,
    ctx.tone ? `Founder tone: ${ctx.tone}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const prompt = `Write a helpful, non-spammy X/Twitter reply (max 280 characters) to this post:

"${ctx.originalPost}"

Context: monitoring ${ctx.keyword ?? "relevant conversations"}.
${projectBits}

Rules:
- Be genuine and add value. Ask a sharp follow-up or share a concrete insight.
- Do not hard-sell. Mention the product only if it naturally fits the conversation.
- No hashtags spam, no em dashes, no emoji overload.
- Return ONLY the reply text.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 100,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    console.error("[replies] OpenAI HTTP", response.status, await response.text());
    return null;
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  const text = data.choices[0]?.message?.content?.trim();
  if (!text) return null;
  return text.slice(0, 280);
}

function generateFallbackReply(originalPost: string, keyword?: string): string {
  const lower = originalPost.toLowerCase();
  if (lower.includes("mrr") || lower.includes("revenue")) {
    return "Congrats on the milestone! Curious - what was the biggest lever for growth in your case?";
  }
  if (keyword?.toLowerCase().includes("vibecod")) {
    return "Totally agree - AI scaffolds fast, but tests and review are what make it production-ready.";
  }
  if (keyword?.toLowerCase().includes("micro-saas") || keyword?.toLowerCase().includes("saas")) {
    return "Love seeing niche tools win. Focused problem + simple pricing seems to be the pattern.";
  }
  return "Great insight - thanks for sharing this openly. Really resonates with the build-in-public journey.";
}
