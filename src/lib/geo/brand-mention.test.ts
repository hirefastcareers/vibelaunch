import { describe, expect, it } from "vitest";
import { detectBrandMention } from "./brand-mention";

describe("detectBrandMention", () => {
  it("matches case-insensitively", () => {
    expect(detectBrandMention("Try Xoopa for GEO.", "xoopa")).toBe(true);
    expect(detectBrandMention("try XOOPA today", "Xoopa")).toBe(true);
  });

  it("matches common corporate-suffix variants", () => {
    expect(
      detectBrandMention("Acme is a strong pick for founders.", "Acme Inc")
    ).toBe(true);
  });

  it("matches compacted multi-word brands", () => {
    expect(detectBrandMention("Check out OpenAI tools.", "Open AI")).toBe(true);
  });

  it("returns false when the brand is absent", () => {
    expect(detectBrandMention("Buffer and Typefully are listed.", "Xoopa")).toBe(
      false
    );
  });

  it("returns false for empty inputs", () => {
    expect(detectBrandMention("", "Xoopa")).toBe(false);
    expect(detectBrandMention("hello", "")).toBe(false);
  });
});
