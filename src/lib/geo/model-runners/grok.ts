import {
  extractUrlsFromText,
  ModelRunnerError,
  readErrorBody,
  type ModelRunResult,
} from "./types";

/**
 * xAI Grok runner — no native citation structure expected.
 * Uses OpenAI-compatible chat completions at https://api.x.ai/v1.
 *
 * Ambiguity (logged in docs/deferred-work.md): xAI docs now prefer
 * `/v1/responses`, while `/v1/chat/completions` remains widely documented
 * for OpenAI-compatible clients. We use chat completions for Anthropic-parity
 * (raw text only, no citation tool). Auth via `XAI_API_KEY` (alias `GROK_API_KEY`).
 */
export async function runGrok(prompt: string): Promise<ModelRunResult> {
  const apiKey =
    process.env.XAI_API_KEY?.trim() || process.env.GROK_API_KEY?.trim();
  if (!apiKey) {
    throw new ModelRunnerError(
      "grok",
      "XAI_API_KEY (or GROK_API_KEY) is not configured"
    );
  }

  const model = process.env.GROK_CITATION_MODEL?.trim() || "grok-4-fast";

  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "user",
          content: `${prompt}\n\nList specific products/brands with URLs when available.`,
        },
      ],
      temperature: 0.2,
      max_tokens: 1024,
    }),
  });

  if (res.status === 429) {
    const body = await readErrorBody(res);
    console.error("[citation-runner:grok] rate limited:", body);
    throw new ModelRunnerError("grok", `rate limited: ${body}`, 429);
  }

  if (!res.ok) {
    const body = await readErrorBody(res);
    console.error("[citation-runner:grok] request failed:", res.status, body);
    throw new ModelRunnerError("grok", body, res.status);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const rawResponse = (data.choices?.[0]?.message?.content ?? "").trim();

  return {
    rawResponse,
    // No first-party citation field — scrape any URLs the model happens to emit.
    citedUrls: extractUrlsFromText(rawResponse),
  };
}
