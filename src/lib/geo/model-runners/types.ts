export type CitationProvider = "openai" | "anthropic" | "gemini" | "perplexity";

export type ModelRunResult = {
  rawResponse: string;
  citedUrls: string[];
};

export class ModelRunnerError extends Error {
  readonly provider: CitationProvider;
  readonly status?: number;

  constructor(provider: CitationProvider, message: string, status?: number) {
    super(`[${provider}] ${message}`);
    this.name = "ModelRunnerError";
    this.provider = provider;
    this.status = status;
  }
}

export function uniqueUrls(urls: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of urls) {
    if (!raw) continue;
    const trimmed = raw.trim();
    if (!trimmed.startsWith("http")) continue;
    if (seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out;
}

export function extractUrlsFromText(text: string): string[] {
  const matches = text.match(/https?:\/\/[^\s)\]>"']+/g) ?? [];
  return uniqueUrls(matches.map((u) => u.replace(/[.,;:]+$/, "")));
}

export async function readErrorBody(res: Response): Promise<string> {
  try {
    const text = await res.text();
    return text.slice(0, 500) || res.statusText;
  } catch {
    return res.statusText || `HTTP ${res.status}`;
  }
}
