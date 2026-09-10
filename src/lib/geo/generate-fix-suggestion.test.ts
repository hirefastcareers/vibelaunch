import { describe, expect, it } from "vitest";
import { FixSuggestionError } from "@/lib/geo/generate-fix-suggestion";

describe("generateFixSuggestion honesty", () => {
  it("exposes a distinguishable error type", () => {
    const err = new FixSuggestionError("boom");
    expect(err.name).toBe("FixSuggestionError");
    expect(err.message).toBe("boom");
  });

  it("rejects missing API key without inventing a brief", async () => {
    const prev = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    const { generateFixSuggestion } = await import(
      "@/lib/geo/generate-fix-suggestion"
    );
    await expect(
      generateFixSuggestion({
        brandName: "Xoopa",
        promptText: "best GEO tools for SaaS",
        model: "openai",
        modelLabel: "ChatGPT",
        mentionRate: 0,
        runsConsidered: 3,
        latestMissed: true,
      })
    ).rejects.toMatchObject({
      name: "FixSuggestionError",
      message: expect.stringContaining("OPENAI_API_KEY"),
    });
    if (prev !== undefined) process.env.OPENAI_API_KEY = prev;
  });
});
