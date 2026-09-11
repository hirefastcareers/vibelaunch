import { describe, expect, it } from "vitest";
import {
  aggregateCitedDomains,
  domainsChangedMeaningfully,
  domainsFingerprint,
  normalizeCitationDomain,
} from "./normalize-citation-domain";

describe("normalizeCitationDomain", () => {
  it("strips www and lowercases", () => {
    expect(normalizeCitationDomain("https://WWW.Example.com/path")).toBe(
      "example.com"
    );
  });

  it("keeps meaningful subdomains", () => {
    expect(normalizeCitationDomain("https://docs.example.com/a")).toBe(
      "docs.example.com"
    );
  });

  it("rejects unusable input", () => {
    expect(normalizeCitationDomain("")).toBeNull();
    expect(normalizeCitationDomain("not a host")).toBeNull();
    expect(normalizeCitationDomain("ftp://example.com")).toBeNull();
  });
});

describe("aggregateCitedDomains", () => {
  it("counts domains across models and keeps samples", () => {
    const tallies = aggregateCitedDomains([
      { url: "https://www.a.com/1", model: "openai" },
      { url: "https://a.com/2", model: "gemini" },
      { url: "https://b.com/x", model: "openai" },
    ]);
    expect(tallies[0]).toMatchObject({
      domain: "a.com",
      count: 2,
      models: ["gemini", "openai"],
    });
    expect(tallies[0]!.sampleUrls).toHaveLength(2);
  });
});

describe("domainsFingerprint", () => {
  it("is order-insensitive on the top set", () => {
    const a = domainsFingerprint([
      { domain: "b.com", count: 1, models: [], sampleUrls: [] },
      { domain: "a.com", count: 5, models: [], sampleUrls: [] },
    ]);
    const b = domainsFingerprint([
      { domain: "a.com", count: 9, models: [], sampleUrls: [] },
      { domain: "b.com", count: 2, models: [], sampleUrls: [] },
    ]);
    expect(a).toBe(b);
  });

  it("detects meaningful domain-set changes", () => {
    const prev = domainsFingerprint([
      { domain: "a.com", count: 3, models: [], sampleUrls: [] },
    ]);
    expect(
      domainsChangedMeaningfully(prev, [
        { domain: "a.com", count: 9, models: [], sampleUrls: [] },
      ])
    ).toBe(false);
    expect(
      domainsChangedMeaningfully(prev, [
        { domain: "b.com", count: 1, models: [], sampleUrls: [] },
      ])
    ).toBe(true);
  });
});
