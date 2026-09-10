import type { CitationSentiment } from "@prisma/client";

export type ClassifySentimentInput = {
  brandName: string;
  rawResponse: string;
};

/**
 * Cheap classifier model for Phase 5.
 *
 * Default: `gpt-4o-mini` (override with OPENAI_SENTIMENT_MODEL).
 * Why this model:
 * - Already used elsewhere in Xoopa for light OpenAI chat work
 * - No web-search / tools — classification is short prompt + short JSON
 * - Much cheaper than citation runners (search-grounded / larger models)
 * - Reliable enough for a 3-way label without inventing values on failure
 */
export const DEFAULT_SENTIMENT_MODEL = "gpt-4o-mini";

export class SentimentClassificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SentimentClassificationError";
  }
}

const SYSTEM = `You classify how an AI answer portrays a specific brand.
Return ONLY valid JSON: {"sentiment":"positive"|"neutral"|"negative"}
Rules:
- positive: brand is recommended, praised, or described favorably
- negative: brand is criticized, warned against, or described unfavorably
- neutral: brand is mentioned factually without clear praise or criticism
- Judge ONLY the portrayal of the named brand, not the overall answer tone
- Do not invent mentions; if the brand is not actually discussed, use neutral`;

/**
 * Classify brand-mention sentiment in a citation response.
 * Returns null when the call fails or the label is unparseable — never guesses.
 */
export async function classifyMentionSentiment(
  input: ClassifySentimentInput
): Promise<CitationSentiment | null> {
  const brandName = input.brandName.trim();
  const rawResponse = input.rawResponse.trim();
  if (!brandName || !rawResponse) {
    return null;
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    console.error(
      "[sentiment] OPENAI_API_KEY missing — leaving sentiment null"
    );
    return null;
  }

  const model =
    process.env.OPENAI_SENTIMENT_MODEL?.trim() || DEFAULT_SENTIMENT_MODEL;

  // Truncate to keep cost low; mention context is usually near the brand hit.
  const excerpt = excerptAroundBrand(rawResponse, brandName, 1800);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        max_tokens: 40,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: [
              `Brand: ${brandName}`,
              "AI answer excerpt:",
              excerpt,
              "",
              'Return {"sentiment":"positive"|"neutral"|"negative"} only.',
            ].join("\n"),
          },
        ],
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error(
        "[sentiment] OpenAI error",
        response.status,
        detail.slice(0, 300)
      );
      return null;
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };

    const content = data.choices?.[0]?.message?.content?.trim() ?? "";
    const parsed = parseSentimentLabel(content);
    if (!parsed) {
      console.error("[sentiment] unparseable classifier output:", content.slice(0, 200));
      return null;
    }

    // Rough cost signal for Phase 7 pricing (gpt-4o-mini list approx).
    const promptTokens = data.usage?.prompt_tokens ?? 0;
    const completionTokens = data.usage?.completion_tokens ?? 0;
    const estimatedUsd =
      (promptTokens * 0.15 + completionTokens * 0.6) / 1_000_000;
    console.info(
      `[sentiment] model=${model} tokens=${promptTokens}+${completionTokens} estUsd=${estimatedUsd.toFixed(6)} label=${parsed}`
    );

    return parsed;
  } catch (err) {
    console.error(
      "[sentiment] classification failed:",
      err instanceof Error ? err.message : err
    );
    return null;
  }
}

export function parseSentimentLabel(raw: string): CitationSentiment | null {
  try {
    const json = JSON.parse(raw) as { sentiment?: string };
    const value = json.sentiment?.trim().toLowerCase();
    if (value === "positive" || value === "neutral" || value === "negative") {
      return value;
    }
  } catch {
    const lowered = raw.toLowerCase();
    for (const label of ["positive", "neutral", "negative"] as const) {
      if (lowered.includes(`"${label}"`) || lowered.includes(`:${label}`)) {
        return label;
      }
    }
  }
  return null;
}

function excerptAroundBrand(
  text: string,
  brandName: string,
  maxLen: number
): string {
  const lower = text.toLowerCase();
  const needle = brandName.toLowerCase();
  const idx = lower.indexOf(needle);
  if (idx < 0) {
    return text.slice(0, maxLen);
  }
  const half = Math.floor(maxLen / 2);
  const start = Math.max(0, idx - half);
  const end = Math.min(text.length, start + maxLen);
  return text.slice(start, end);
}
