import { describe, it, expect } from "vitest";
import {
  buildSoftwareApplicationSchema,
  buildFAQPageSchema,
  buildGeoJsonLd,
  serializeJsonLd,
} from "@/lib/geo/llm-schema";

const input = {
  projectName: "Sorano",
  projectUrl: "https://sorano.app",
  description: "Autonomous indie growth engine",
  tagline: "Launch smarter",
  keywords: ["indie", "saas"],
  changelogTitle: "v2 Release",
  changelogSummary: "Adaptive AI is live",
  changelogUrl: "https://sorano.app/changelog/v2",
};

describe("llm-schema", () => {
  it("builds SoftwareApplication schema with pricing and audience", () => {
    const schema = buildSoftwareApplicationSchema(input);
    expect(schema["@type"]).toBe("SoftwareApplication");
    expect(schema.name).toBe("Sorano");
    expect(schema.publisher).toMatchObject({ name: "Sorano" });
    expect(schema.offers).toMatchObject({ price: "0", priceCurrency: "USD" });
    expect(schema.audience.audienceType).toContain("Indie hackers");
    expect(schema.featureList).toContain("GEO citation tracking for ChatGPT, Perplexity, and Claude");
  });

  it("builds FAQPage with comparison question", () => {
    const schema = buildFAQPageSchema(input);
    expect(schema["@type"]).toBe("FAQPage");
    const questions = schema.mainEntity.map((q) => q.name);
    expect(questions).toContain("How does Sorano compare to alternatives?");
  });

  it("combines schemas in @graph", () => {
    const graph = buildGeoJsonLd(input);
    expect(graph["@graph"]).toHaveLength(3);
  });

  it("escapes HTML in serialized JSON-LD", () => {
    const serialized = serializeJsonLd({ text: "<script>" });
    expect(serialized).not.toContain("<script>");
    expect(serialized).toContain("\\u003c");
  });
});
