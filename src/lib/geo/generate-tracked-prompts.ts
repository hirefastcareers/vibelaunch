/**
 * Generate buyer-intent tracked prompts for citation onboarding.
 * Uses the same OpenAI chat-completions path as the adaptive post generator.
 * Never invents prompts when the API call fails — callers must surface the error.
 */

export type GenerateTrackedPromptsInput = {
  brandName: string;
  websiteUrl: string;
  descriptors: string[];
};

export type GenerateTrackedPromptsResult = {
  prompts: string[];
  model: string;
};

export class PromptGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PromptGenerationError";
  }
}

const SYSTEM = `You help brands set up AI citation tracking.
Given a brand name, website, and short descriptors, invent 8–10 realistic
buyer-intent questions someone would type into ChatGPT, Claude, Perplexity,
Gemini, or Grok when shopping in that category.

Rules:
- Sound like real user queries (e.g. "best [category] tool for [use case]").
- Do NOT include the brand name in every prompt; mix brand-agnostic category
  queries with a few that could surface the brand.
- Keep each prompt under 120 characters.
- Return ONLY a JSON array of strings. No markdown, no commentary.`;

export async function generateTrackedPrompts(
  input: GenerateTrackedPromptsInput
): Promise<GenerateTrackedPromptsResult> {
  const brandName = input.brandName.trim();
  const websiteUrl = input.websiteUrl.trim();
  const descriptors = input.descriptors.map((d) => d.trim()).filter(Boolean);

  if (!brandName) {
    throw new PromptGenerationError("Brand name is required");
  }
  if (!websiteUrl) {
    throw new PromptGenerationError("Website URL is required");
  }
  if (descriptors.length < 2 || descriptors.length > 4) {
    throw new PromptGenerationError("Provide 2–4 short descriptors");
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new PromptGenerationError(
      "OPENAI_API_KEY is not configured, so prompts cannot be generated"
    );
  }

  const model = process.env.OPENAI_PROMPT_LIBRARY_MODEL?.trim() || "gpt-4o-mini";

  const user = [
    `Brand: ${brandName}`,
    `Website: ${websiteUrl}`,
    `Descriptors: ${descriptors.join("; ")}`,
    "",
    "Return a JSON array of 8–10 buyer-intent prompt strings.",
  ].join("\n");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: user },
      ],
      temperature: 0.5,
      max_tokens: 800,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.error(
      "[generate-tracked-prompts] OpenAI failed:",
      response.status,
      body.slice(0, 400)
    );
    throw new PromptGenerationError(
      `Prompt generation failed (OpenAI HTTP ${response.status})`
    );
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new PromptGenerationError("OpenAI returned an empty response");
  }

  const prompts = parsePromptList(content);
  if (prompts.length < 6) {
    throw new PromptGenerationError(
      `Expected at least 6 prompts, got ${prompts.length}`
    );
  }

  return { prompts: prompts.slice(0, 10), model };
}

function parsePromptList(content: string): string[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new PromptGenerationError("OpenAI response was not valid JSON");
  }

  let raw: unknown[] = [];
  if (Array.isArray(parsed)) {
    raw = parsed;
  } else if (parsed && typeof parsed === "object") {
    const obj = parsed as Record<string, unknown>;
    const candidate =
      obj.prompts ?? obj.queries ?? obj.items ?? obj.results ?? null;
    if (Array.isArray(candidate)) raw = candidate;
  }

  const prompts = raw
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((p) => p.length >= 3 && p.length <= 200);

  return [...new Set(prompts)];
}
