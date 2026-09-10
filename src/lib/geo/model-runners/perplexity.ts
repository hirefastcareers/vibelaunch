import {
  ModelRunnerError,
  readErrorBody,
  type ModelRunResult,
  uniqueUrls,
} from "./types";

/**
 * Perplexity chat completions — extract `citations` array from the response.
 */
export async function runPerplexity(prompt: string): Promise<ModelRunResult> {
  const apiKey = process.env.PERPLEXITY_API_KEY?.trim();
  if (!apiKey) {
    throw new ModelRunnerError("perplexity", "PERPLEXITY_API_KEY is not configured");
  }

  const model = process.env.PERPLEXITY_CITATION_MODEL?.trim() || "sonar";

  const res = await fetch("https://api.perplexity.ai/chat/completions", {
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
      max_tokens: 1024,
      temperature: 0.2,
    }),
  });

  if (res.status === 429) {
    const body = await readErrorBody(res);
    console.error("[citation-runner:perplexity] rate limited:", body);
    throw new ModelRunnerError("perplexity", `rate limited: ${body}`, 429);
  }

  if (!res.ok) {
    const body = await readErrorBody(res);
    console.error("[citation-runner:perplexity] request failed:", res.status, body);
    throw new ModelRunnerError("perplexity", body, res.status);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    citations?: string[];
  };

  const rawResponse = (data.choices?.[0]?.message?.content ?? "").trim();
  const citedUrls = uniqueUrls(data.citations ?? []);

  return { rawResponse, citedUrls };
}
