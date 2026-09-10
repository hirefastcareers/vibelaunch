import { describe, expect, it } from "vitest";
import { PromptGenerationError } from "./generate-tracked-prompts";

// parsePromptList is private — exercise via generateTrackedPrompts with mocked fetch.

describe("generateTrackedPrompts", () => {
  it("PromptGenerationError is distinguishable", () => {
    const err = new PromptGenerationError("boom");
    expect(err.name).toBe("PromptGenerationError");
    expect(err.message).toBe("boom");
  });

  it("rejects missing API key without inventing prompts", async () => {
    const prev = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    const { generateTrackedPrompts } = await import("./generate-tracked-prompts");
    await expect(
      generateTrackedPrompts({
        brandName: "Acme",
        websiteUrl: "https://acme.example",
        descriptors: ["CRM", "indie founders"],
      })
    ).rejects.toMatchObject({
      name: "PromptGenerationError",
      message: expect.stringContaining("OPENAI_API_KEY"),
    });
    if (prev !== undefined) process.env.OPENAI_API_KEY = prev;
  });

  it("parses JSON object with prompts array from OpenAI", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  prompts: [
                    "best CRM for indie founders",
                    "simple CRM for solo consultants",
                    "CRM alternatives for small agencies",
                    "how to track customer emails without Salesforce",
                    "lightweight sales pipeline tools 2026",
                    "best tool for freelance client management",
                    "CRM with email sequences for bootstrappers",
                    "affordable CRM for two-person startups",
                  ],
                }),
              },
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );

    const { generateTrackedPrompts } = await import("./generate-tracked-prompts");
    const result = await generateTrackedPrompts({
      brandName: "Acme",
      websiteUrl: "https://acme.example",
      descriptors: ["CRM", "indie founders"],
    });
    expect(result.prompts).toHaveLength(8);
    expect(result.prompts[0]).toContain("CRM");

    globalThis.fetch = originalFetch;
  });
});
