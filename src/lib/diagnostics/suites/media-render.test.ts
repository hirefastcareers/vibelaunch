import { describe, it, expect } from "vitest";
import { validateMediaUrls } from "@/lib/media/engine";
import { renderCodeCard } from "@/lib/media/code-card";

describe("media render audit helpers", () => {
  it("validates acceptable media URLs", () => {
    const result = validateMediaUrls(["https://example.com/a.png"]);
    expect(result.valid).toBe(true);
  });

  it("rejects unsupported formats", () => {
    const result = validateMediaUrls(["https://example.com/file.pdf"]);
    expect(result.valid).toBe(false);
  });

  it("renders code card with expected dimensions", async () => {
    const card = await renderCodeCard({ code: "export {}", language: "typescript" });
    expect(card.width).toBe(1200);
    expect(card.height).toBe(630);
    expect(card.imageUrl).toContain("code-card");
  });
});
