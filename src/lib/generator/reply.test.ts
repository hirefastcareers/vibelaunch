import { describe, expect, it } from "vitest";
import { generateFallbackReply } from "./reply";

describe("generateFallbackReply", () => {
  it("mentions the product on launch posts", () => {
    const reply = generateFallbackReply("Just shipped v2 today", {
      project: { name: "Xoopa" },
    });
    expect(reply).toMatch(/Xoopa/);
    expect(reply.length).toBeLessThanOrEqual(280);
  });

  it("asks a follow-up on revenue posts", () => {
    const reply = generateFallbackReply("Hit $1k MRR this month");
    expect(reply.toLowerCase()).toMatch(/milestone|lever|compound/);
  });
});
