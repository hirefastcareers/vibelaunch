import type { CitationModel } from "@prisma/client";

export type GenerateFixSuggestionInput = {
  brandName: string;
  promptText: string;
  model: CitationModel;
  modelLabel: string;
  mentionRate: number;
  runsConsidered: number;
  latestMissed: boolean;
};

export type GenerateFixSuggestionResult = {
  suggestionText: string;
  model: string;
};

export class FixSuggestionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FixSuggestionError";
  }
}

const SYSTEM = `You are a GEO (generative engine optimization) strategist.
Given a brand that is missing from AI answers for a specific buyer-intent query,
write a concrete content brief that would help the brand get cited.

Return plain text (no markdown fences) with these labeled sections:
1) Angle — one sentence framing
2) Format — one of: comparison page, FAQ, case study, how-to guide, landing section
3) Key points — 4–6 bullet lines the page/post must cover
4) Why this helps — one short sentence tying the brief to the AI query gap

Be specific to the query and brand. Do not invent citations or claim the brand
is already mentioned. Keep the whole brief under 220 words.`;

/**
 * Generate a gap-specific content brief via the same OpenAI chat path used for
 * Phase 3 prompt-library generation. Never invents a brief when the call fails.
 */
export async function generateFixSuggestion(
  input: GenerateFixSuggestionInput
): Promise<GenerateFixSuggestionResult> {
  const brandName = input.brandName.trim();
  const promptText = input.promptText.trim();
  if (!brandName || !promptText) {
    throw new FixSuggestionError("Brand name and tracked prompt are required");
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new FixSuggestionError(
      "OPENAI_API_KEY is not configured — cannot generate a fix suggestion"
    );
  }

  const model =
    process.env.OPENAI_FIX_SUGGESTION_MODEL?.trim() || "gpt-4o-mini";

  const user = [
    `Brand: ${brandName}`,
    `Tracked query: ${promptText}`,
    `AI model with gap: ${input.modelLabel} (${input.model})`,
    `Recent mention rate: ${input.mentionRate}% across ${input.runsConsidered} successful run(s)`,
    `Latest run missed brand: ${input.latestMissed ? "yes" : "no"}`,
    "",
    "Write the content brief now.",
  ].join("\n");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      max_tokens: 500,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: user },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error(
      "[fix-suggestion] OpenAI error",
      response.status,
      detail.slice(0, 300)
    );
    throw new FixSuggestionError(
      `Fix suggestion generation failed (OpenAI HTTP ${response.status})`
    );
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const suggestionText = data.choices?.[0]?.message?.content?.trim() ?? "";
  if (suggestionText.length < 40) {
    throw new FixSuggestionError(
      "OpenAI returned an empty or too-short suggestion"
    );
  }

  return { suggestionText, model };
}
