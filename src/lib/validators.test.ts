import { describe, it, expect } from "vitest";
import { createProjectSchema, createPostSchema, seoPublishSchema } from "@/lib/validators";

describe("Validators", () => {
  it("validates project creation", () => {
    const result = createProjectSchema.safeParse({
      name: "My Launch",
      slug: "my-launch",
      tagline: "Ship faster",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid slug", () => {
    const result = createProjectSchema.safeParse({
      name: "Test",
      slug: "Invalid Slug!",
    });
    expect(result.success).toBe(false);
  });

  it("validates post content length", () => {
    const result = createPostSchema.safeParse({
      content: "Hello world",
    });
    expect(result.success).toBe(true);

    const tooLong = createPostSchema.safeParse({
      content: "x".repeat(281),
    });
    expect(tooLong.success).toBe(false);
  });

  it("allows SEO publish without a prewritten body", () => {
    const result = seoPublishSchema.safeParse({
      projectId: "clxxxxxxxxxxxxxxxx",
      title: "v1.0 Release",
      summary: "We shipped the first version.",
    });
    expect(result.success).toBe(true);
  });
});
