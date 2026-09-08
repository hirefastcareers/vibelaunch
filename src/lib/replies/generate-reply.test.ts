import { describe, expect, it } from "vitest";
import { generateSmartReply } from "./generate-reply";

describe("generateSmartReply", () => {
  it("returns a short fallback without OpenAI", async () => {
    const prev = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    const reply = await generateSmartReply({
      originalPost: "Just hit $1k MRR after months of shipping",
      keyword: "#buildinpublic",
      projectName: "Xoopa",
    });

    expect(reply.length).toBeGreaterThan(10);
    expect(reply.length).toBeLessThanOrEqual(280);
    expect(reply.toLowerCase()).toMatch(/milestone|congrats|lever/);

    if (prev !== undefined) process.env.OPENAI_API_KEY = prev;
  });
});
