import { describe, it, expect } from "vitest";
import { codeCardBlobPath, visibleCodeLines, MAX_VISIBLE_LINES } from "@/lib/media/code-card-layout";

describe("code card layout", () => {
  it("uses a distinct blob path for different code, language, and title", () => {
    const base = { code: "const a = 1", language: "ts", title: "Alpha" };
    const paths = [
      codeCardBlobPath(base),
      codeCardBlobPath({ ...base, code: "const b = 2" }),
      codeCardBlobPath({ ...base, language: "js" }),
      codeCardBlobPath({ ...base, title: "Beta" }),
    ];
    expect(new Set(paths).size).toBe(4);
    expect(paths.every((p) => p.startsWith("code-cards/") && p.endsWith(".png"))).toBe(true);
  });

  it("reuses the same path for identical inputs", () => {
    const options = { code: "fn main() {}", language: "rust", title: "Main" };
    expect(codeCardBlobPath(options)).toBe(codeCardBlobPath({ ...options }));
  });

  it("caps visible lines and marks overflow", () => {
    const code = Array.from({ length: 30 }, (_, i) => `line ${i + 1}`).join("\n");
    const { lines, truncated } = visibleCodeLines(code);
    expect(truncated).toBe(true);
    expect(lines).toHaveLength(MAX_VISIBLE_LINES - 1);
    expect(lines[0]).toBe("line 1");
  });
});
