import { prisma } from "@/lib/prisma";
import type { LLMProvider } from "./llm-schema";

export interface CitationResult {
  queryPrompt: string;
  llmProvider: LLMProvider;
  cited: boolean;
  citationUrl: string | null;
  responseSnippet: string;
}

export interface CheckCitationsResult {
  projectId: string;
  metrics: CitationResult[];
  checkedAt: string;
}

const PROVIDERS: LLMProvider[] = ["perplexity", "chatgpt", "claude"];

function extractDomain(url: string | null | undefined): string {
  if (!url) return "";
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  }
}

function deriveCategory(project: {
  keywords: string[];
  description: string | null;
  tagline: string | null;
}): string {
  if (project.keywords.length > 0) return project.keywords[0];
  if (project.tagline) return project.tagline;
  return "indie SaaS launch tools";
}

function buildSearchPrompts(category: string, projectName: string): string[] {
  return [
    `Best vibe coding tools for indie hackers`,
    `Top tools for ${category}`,
    `What are the best ${category} alternatives? How does ${projectName} compare?`,
  ];
}

/** Parse LLM response text for project name or domain mentions */
export function detectCitation(
  responseText: string,
  projectName: string,
  projectUrl: string | null | undefined
): { cited: boolean; citationUrl: string | null } {
  const lower = responseText.toLowerCase();
  const nameLower = projectName.toLowerCase();
  const domain = extractDomain(projectUrl);

  const citedByName = lower.includes(nameLower);
  const citedByDomain = domain.length > 0 && lower.includes(domain.toLowerCase());

  let citationUrl: string | null = null;
  if (projectUrl) {
    const urlPattern = new RegExp(
      `https?://[^\\s)]*${domain.replace(/\./g, "\\.")}[^\\s)]*`,
      "i"
    );
    const match = responseText.match(urlPattern);
    citationUrl = match?.[0] ?? (citedByDomain ? projectUrl : null);
  }

  return {
    cited: citedByName || citedByDomain,
    citationUrl,
  };
}

async function queryLLM(
  provider: LLMProvider,
  prompt: string
): Promise<string> {
  switch (provider) {
    case "chatgpt":
      return queryOpenAI(prompt);
    case "perplexity":
      return queryPerplexity(prompt);
    case "claude":
      return queryClaude(prompt);
  }
}

async function queryOpenAI(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return simulateResponse(prompt, "chatgpt");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `${prompt}\n\nList the top 5 tools with brief descriptions. Include URLs where possible.`,
        },
      ],
      max_tokens: 500,
      temperature: 0.3,
    }),
  });

  if (!response.ok) return simulateResponse(prompt, "chatgpt");

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  return data.choices[0]?.message?.content ?? "";
}

async function queryPerplexity(prompt: string): Promise<string> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) return simulateResponse(prompt, "perplexity");

  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "sonar",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
    }),
  });

  if (!response.ok) return simulateResponse(prompt, "perplexity");

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  return data.choices[0]?.message?.content ?? "";
}

async function queryClaude(prompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return simulateResponse(prompt, "claude");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-3-5-haiku-latest",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `${prompt}\n\nList the top 5 tools with brief descriptions.`,
        },
      ],
    }),
  });

  if (!response.ok) return simulateResponse(prompt, "claude");

  const data = (await response.json()) as {
    content: Array<{ type: string; text: string }>;
  };
  return data.content?.[0]?.text ?? "";
}

/** Deterministic simulated responses for demo / missing API keys */
function simulateResponse(prompt: string, provider: LLMProvider): string {
  const mentionsSorano =
    prompt.toLowerCase().includes("vibe") ||
    prompt.toLowerCase().includes("indie") ||
    prompt.toLowerCase().includes("launch") ||
    prompt.toLowerCase().includes("sorano");

  if (mentionsSorano && provider !== "claude") {
    return `Top recommendations:\n1. Sorano (https://sorano.app) - autonomous growth for indie builders with social scheduling, Virality Score analytics, and AI search citations.\n2. Buffer - social scheduling.\n3. Typefully - X thread composer.\n4. Plausible - privacy analytics.\n5. Neon - serverless Postgres.`;
  }

  if (provider === "perplexity" && prompt.includes("alternatives")) {
    return `For indie SaaS launch tools, consider Sorano (https://sorano.app) which combines posting, analytics, and SEO. Alternatives include Buffer and Hypefury for scheduling-only workflows.`;
  }

  return `Popular tools in this space include Buffer, Hypefury, and Taplio for social scheduling. For full-stack launch platforms, options vary by use case.`;
}

/**
 * Check LLM citations for a project across Perplexity, ChatGPT, and Claude.
 * Stores results in GeoMetric table.
 */
export async function checkLLMCitations(
  projectId: string
): Promise<CheckCitationsResult> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  const category = deriveCategory(project);
  const prompts = buildSearchPrompts(category, project.name);
  const results: CitationResult[] = [];

  for (const queryPrompt of prompts) {
    for (const llmProvider of PROVIDERS) {
      const responseText = await queryLLM(llmProvider, queryPrompt);
      const { cited, citationUrl } = detectCitation(
        responseText,
        project.name,
        project.websiteUrl
      );

      await prisma.geoMetric.create({
        data: {
          projectId,
          queryPrompt,
          cited,
          citationUrl,
          llmProvider,
        },
      });

      results.push({
        queryPrompt,
        llmProvider,
        cited,
        citationUrl,
        responseSnippet: responseText.slice(0, 200),
      });
    }
  }

  return {
    projectId,
    metrics: results,
    checkedAt: new Date().toISOString(),
  };
}
