import OpenAI from "openai";
import {
  extractUrlsFromText,
  ModelRunnerError,
  type ModelRunResult,
  uniqueUrls,
} from "./types";

/**
 * OpenAI Responses API + web search.
 *
 * Ambiguity note (logged in docs/deferred-work.md):
 * Official docs prefer `tools: [{ type: "web_search" }]`, but openai@4.104
 * TypeScript types only expose `web_search_preview`. We call with
 * `web_search_preview` (typed) and fall back to untyped `web_search` if the
 * preview tool is rejected by the API.
 */
export async function runOpenAI(prompt: string): Promise<ModelRunResult> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new ModelRunnerError("openai", "OPENAI_API_KEY is not configured");
  }

  const client = new OpenAI({ apiKey });
  const input = `${prompt}\n\nList specific products/brands with URLs when available.`;

  try {
    const response = await createWithWebSearch(client, input, "web_search_preview");
    return parseOpenAIResponse(response as unknown as OpenAIResponseShape);
  } catch (previewErr) {
    const message =
      previewErr instanceof Error ? previewErr.message : String(previewErr);
    console.error("[citation-runner:openai] web_search_preview failed:", message);

    try {
      const response = await createWithWebSearch(client, input, "web_search");
      return parseOpenAIResponse(response as unknown as OpenAIResponseShape);
    } catch (searchErr) {
      const detail =
        searchErr instanceof Error ? searchErr.message : String(searchErr);
      console.error("[citation-runner:openai] web_search fallback failed:", detail);
      throw new ModelRunnerError("openai", detail);
    }
  }
}

type OpenAIResponseShape = {
  output_text?: string;
  output?: Array<Record<string, unknown>>;
};

async function createWithWebSearch(
  client: OpenAI,
  input: string,
  toolType: "web_search_preview" | "web_search"
) {
  // Cast needed: installed SDK types list web_search_preview only.
  return client.responses.create({
    model: process.env.OPENAI_CITATION_MODEL?.trim() || "gpt-4o-mini",
    input,
    tools: [{ type: toolType } as { type: "web_search_preview" }],
  });
}

function parseOpenAIResponse(response: OpenAIResponseShape): ModelRunResult {
  const rawResponse = (response.output_text ?? "").trim();
  const citedUrls = uniqueUrls([
    ...extractAnnotationUrls(response.output ?? []),
    ...extractUrlsFromText(rawResponse),
  ]);
  return { rawResponse, citedUrls };
}

function extractAnnotationUrls(
  output: Array<Record<string, unknown>>
): string[] {
  const urls: string[] = [];
  for (const item of output) {
    if (item.type === "message" && Array.isArray(item.content)) {
      for (const part of item.content as Array<Record<string, unknown>>) {
        if (!Array.isArray(part.annotations)) continue;
        for (const ann of part.annotations as Array<Record<string, unknown>>) {
          if (ann.type === "url_citation" && typeof ann.url === "string") {
            urls.push(ann.url);
          }
        }
      }
    }
    if (item.type === "web_search_call") {
      const action = item.action as Record<string, unknown> | undefined;
      const sources = action?.sources;
      if (Array.isArray(sources)) {
        for (const source of sources as Array<Record<string, unknown>>) {
          if (typeof source.url === "string") urls.push(source.url);
        }
      }
    }
  }
  return urls;
}
