import {
  ModelRunnerError,
  readErrorBody,
  type ModelRunResult,
  uniqueUrls,
} from "./types";

/**
 * Gemini generateContent with Google Search grounding.
 * citedUrls come from groundingMetadata.groundingChunks[].web.uri
 */
export async function runGemini(prompt: string): Promise<ModelRunResult> {
  const apiKey = process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_AI_API_KEY?.trim();
  if (!apiKey) {
    throw new ModelRunnerError(
      "gemini",
      "GEMINI_API_KEY (or GOOGLE_AI_API_KEY) is not configured"
    );
  }

  const model =
    process.env.GEMINI_CITATION_MODEL?.trim() || "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${prompt}\n\nList specific products/brands with URLs when available.`,
            },
          ],
        },
      ],
      tools: [{ google_search: {} }],
    }),
  });

  if (res.status === 429) {
    const body = await readErrorBody(res);
    console.error("[citation-runner:gemini] rate limited:", body);
    throw new ModelRunnerError("gemini", `rate limited: ${body}`, 429);
  }

  if (!res.ok) {
    const body = await readErrorBody(res);
    console.error("[citation-runner:gemini] request failed:", res.status, body);
    throw new ModelRunnerError("gemini", body, res.status);
  }

  const data = (await res.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
      groundingMetadata?: {
        groundingChunks?: Array<{ web?: { uri?: string; title?: string } }>;
      };
    }>;
  };

  const candidate = data.candidates?.[0];
  const rawResponse = (candidate?.content?.parts ?? [])
    .map((part) => part.text ?? "")
    .join("")
    .trim();

  const citedUrls = uniqueUrls(
    (candidate?.groundingMetadata?.groundingChunks ?? []).map(
      (chunk) => chunk.web?.uri
    )
  );

  return { rawResponse, citedUrls };
}
