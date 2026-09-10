import type { CitationProvider, ModelRunResult } from "./types";
import { runOpenAI } from "./openai";
import { runAnthropic } from "./anthropic";
import { runGemini } from "./gemini";
import { runPerplexity } from "./perplexity";
import { runGrok } from "./grok";

export const CITATION_PROVIDERS: CitationProvider[] = [
  "openai",
  "anthropic",
  "gemini",
  "perplexity",
  "grok",
];

export async function runCitationModel(
  provider: CitationProvider,
  prompt: string
): Promise<ModelRunResult> {
  switch (provider) {
    case "openai":
      return runOpenAI(prompt);
    case "anthropic":
      return runAnthropic(prompt);
    case "gemini":
      return runGemini(prompt);
    case "perplexity":
      return runPerplexity(prompt);
    case "grok":
      return runGrok(prompt);
  }
}

export type { CitationProvider, ModelRunResult } from "./types";
export { ModelRunnerError } from "./types";
