/**
 * Code snippet to PNG renderer stub.
 * In production, renders syntax-highlighted code to a shareable PNG card.
 */
export interface CodeCardOptions {
  code: string;
  language?: string;
  title?: string;
  theme?: "dark" | "light";
}

export interface CodeCardResult {
  imageUrl: string;
  width: number;
  height: number;
}

export async function renderCodeCard(options: CodeCardOptions): Promise<CodeCardResult> {
  const id = Buffer.from(options.code.slice(0, 32)).toString("base64url").slice(0, 16);

  return {
    imageUrl: `/api/media/placeholder?type=code-card&id=${id}&lang=${options.language ?? "typescript"}`,
    width: 1200,
    height: 630,
  };
}
