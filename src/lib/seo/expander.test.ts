import { describe, it, expect } from "vitest";
import { generateSitemapEntries } from "@/lib/seo/expander";

describe("SEO expander", () => {
  it("generates valid sitemap XML", () => {
    const xml = generateSitemapEntries("https://sorano.app", [
      { slug: "v1-release", publishedAt: new Date("2026-01-15") },
      { slug: "v2-update", publishedAt: new Date("2026-02-01") },
    ]);

    expect(xml).toContain('<?xml version="1.0"');
    expect(xml).toContain("<urlset");
    expect(xml).toContain("https://sorano.app/changelog/v1-release");
    expect(xml).toContain("https://sorano.app/changelog/v2-update");
    expect(xml).toContain("<lastmod>2026-01-15</lastmod>");
  });

  it("excludes unpublished entries", () => {
    const xml = generateSitemapEntries("https://sorano.app", [
      { slug: "draft-entry", publishedAt: null },
    ]);
    expect(xml).not.toContain("draft-entry");
  });
});
