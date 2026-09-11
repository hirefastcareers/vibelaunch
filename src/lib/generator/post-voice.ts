import { withDirectProseInstruction } from "@/lib/ai/prose-style";

const MAX_POST_CHARS = 280;

const GOLDEN_EXAMPLE =
  "X sign-in is live on Xoopa. Connect X once, then product updates become citeable posts and articles without a second tool.";

const SLOP_PHRASES = [
  /\bexciting news!?\b/gi,
  /\bbig announcement!?\b/gi,
  /\bwe(?:'re| are) (?:thrilled|excited|pumped)!?\b/gi,
  /\beffortlessly\b/gi,
  /\bviral\b/gi,
  /\blet['’]?s make your updates shine!?\b/gi,
  /\bdon'?t sleep on this!?\b/gi,
  /\bgame-?changer\b/gi,
  /\bunleash(?:ed)?\b/gi,
  /\bunlock(?:ed|s)?\b/gi,
  /\bsmart AI recommendations\b/gi,
  /\ball automatically!?\b/gi,
  /\bgoogle-ranked\b/gi,
  /\bjust leveled up!?\b/gi,
  /\bis HERE\b/g,
  /\bsomething cool\b/gi,
];

export function buildPostPrompt(input: {
  name: string;
  tagline: string | null;
  description: string | null;
  topic: string;
  tone: string;
  examples: string;
  trackedQueries?: string[];
}): string {
  const queryBlock =
    input.trackedQueries && input.trackedQueries.length > 0
      ? `Tracked queries this content should support (write so AI search could cite these facts):\n${input.trackedQueries
          .map((q) => `- ${q}`)
          .join("\n")}`
      : "Write content likely to be cited by AI search when someone asks for tools or topics related to this product.";

  return withDirectProseInstruction(`Write one X post for ${input.name}. Max ${MAX_POST_CHARS} characters.

Topic: ${input.topic}
Tagline: ${input.tagline ?? "none"}
Product: ${input.description ?? "none"}
Voice: ${input.tone}, but never marketing copy.

Goal: one concrete, citeable product fact for AI search / GEO. X is a distribution channel, not an engagement farm.

${queryBlock}

Write like a founder posting a changelog. Name the thing that shipped, then say what someone can do now.

Good:
${GOLDEN_EXAMPLE}

Bad:
Exciting news! X sign-in is now live on Xoopa! Effortlessly turn your product updates into viral posts! #Xoopa

Rules:
- One or two short sentences
- Prefer specific nouns, numbers, and capabilities AI engines can quote
- No emojis, hashtags, slogans, or "exciting news"
- No em dashes
- Do not say viral, effortlessly, game-changer, or shine
- Use past posts only for facts, not for their phrasing
- Return only the post text

Past posts:
${input.examples || "None yet."}`);
}

export function cleanGeneratedPost(raw: string): string {
  let text = raw.trim();
  if (
    (text.startsWith('"') && text.endsWith('"')) ||
    (text.startsWith("'") && text.endsWith("'"))
  ) {
    text = text.slice(1, -1).trim();
  }

  text = text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, "");
  text = text.replace(/#[\p{L}\p{N}_]+/gu, "");
  text = text.replace(/[—–]/g, ". ");

  for (const phrase of SLOP_PHRASES) {
    text = text.replace(phrase, " ");
  }

  text = text.replace(/[ \t]+/g, " ");
  text = text.replace(/ ?\n ?/g, " ");
  text = text.replace(/\s+([,.!?])/g, "$1");
  text = text.replace(/([.!?]){2,}/g, "$1");
  text = text.replace(/^[,.\s]+/, "").trim();

  if (text.length > MAX_POST_CHARS) {
    text = text.slice(0, MAX_POST_CHARS).replace(/\s+\S*$/, "").trim();
  }

  return text;
}

export function buildFallbackPost(
  project: { name: string; tagline: string | null; description?: string | null },
  topic: string,
): string {
  const name = project.name.trim() || "the product";
  const first = firstSentence(name, topic);
  const next =
    project.tagline?.trim() ||
    project.description?.trim().split(/(?<=\.)\s+/)[0] ||
    "";
  const second = next && !first.toLowerCase().includes(next.toLowerCase())
    ? ` ${next.replace(/[.!?]+$/, "")}.`
    : "";
  return cleanGeneratedPost(`${first}${second}`);
}

function firstSentence(name: string, topic: string): string {
  const trimmed = topic.trim().replace(/[.!?]+$/, "");
  if (!trimmed) return `${name} has a new update.`;

  const mentionsName = new RegExp(`\\b${escapeRegExp(name)}\\b`, "i").test(trimmed);
  if (/ is live\b/i.test(trimmed)) {
    return mentionsName ? `${trimmed}.` : `${trimmed} on ${name}.`;
  }
  return mentionsName ? `${trimmed}.` : `${trimmed} is live on ${name}.`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
