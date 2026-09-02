import { createHash } from "crypto";

export const CODE_CARD_WIDTH = 1200;
export const CODE_CARD_HEIGHT = 630;
export const MAX_VISIBLE_LINES = 20;
export const MAX_LINE_CHARS = 88;

export interface CodeCardIdentity {
  code: string;
  language?: string;
  title?: string;
}

export function codeCardBlobPath(options: CodeCardIdentity): string {
  const id = createHash("sha256")
    .update(options.code)
    .update("\0")
    .update(options.language ?? "")
    .update("\0")
    .update(options.title ?? "")
    .digest("hex")
    .slice(0, 24);
  return `code-cards/${id}.png`;
}

export function visibleCodeLines(code: string): { lines: string[]; truncated: boolean } {
  const raw = code.replace(/\r\n/g, "\n").split("\n").map((line) => line.replace(/\t/g, "  "));
  const truncated = raw.length > MAX_VISIBLE_LINES;
  const slice = truncated ? raw.slice(0, MAX_VISIBLE_LINES - 1) : raw;
  const lines = slice.map((line) =>
    line.length > MAX_LINE_CHARS ? `${line.slice(0, MAX_LINE_CHARS - 1)}…` : line
  );
  return { lines, truncated };
}
