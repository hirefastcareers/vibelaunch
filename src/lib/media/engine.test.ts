import { describe, it, expect } from "vitest";
import { validateMediaUrls } from "@/lib/media/engine";

describe("Media engine", () => {
  it("validates allowed image URLs", () => {
    const result = validateMediaUrls([
      "https://example.com/image.jpg",
      "https://example.com/photo.png",
    ]);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects more than 4 media attachments", () => {
    const urls = Array.from({ length: 5 }, (_, i) => `https://example.com/img${i}.jpg`);
    const result = validateMediaUrls(urls);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("Maximum 4");
  });

  it("rejects unsupported formats", () => {
    const result = validateMediaUrls(["https://example.com/file.pdf"]);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("Unsupported");
  });

  it("rejects invalid URLs", () => {
    const result = validateMediaUrls(["not-a-url"]);
    expect(result.valid).toBe(false);
  });
});
