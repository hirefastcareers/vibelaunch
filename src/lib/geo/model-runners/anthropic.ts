import {
  extractUrlsFromText,
  ModelRunnerError,
  readErrorBody,
  type ModelRunResult,
} from "./types";

/**
 * Anthropic Messages API — no first-party citation/web-search tool.
 * Returns rawResponse only; citedUrls inferred from any URLs in the text.
 */
export async function runAnthropic(prompt: string): Promise<ModelRunResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    throw new ModelRunnerError("anthropic", "ANTHROPIC_API_KEY is not configured");
  }

  const model =
    process.env.ANTHROPIC_CITATION_MODEL?.trim() || "claude-3-5-haiku-latest";

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `${prompt}\n\nList specific products/brands with URLs when available.`,
        },
      ],
    }),
  });

  if (res.status === 429) {
    const body = await readErrorBody(res);
    console.error("[citation-runner:anthropic] rate limited:", body);
    throw new ModelRunnerError("anthropic", `rate limited: ${body}`, 429);
  }

  if (!res.ok) {
    const body = await readErrorBody(res);
    console.error("[citation-runner:anthropic] request failed:", res.status, body);
    throw new ModelRunnerError("anthropic", body, res.status);
  }

  const data = (await res.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  const rawResponse = (data.content ?? [])
    .filter((part) => part.type === "text" && part.text)
    .map((part) => part.text!)
    .join("\n")
    .trim();

  return {
    rawResponse,
    citedUrls: extractUrlsFromText(rawResponse),
  };
}
