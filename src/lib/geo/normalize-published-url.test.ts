import { describe, expect, it } from "vitest";
import {
  bestMatchAgainstCitedUrls,
  matchPublishedAgainstCited,
  normalizePublishedUrl,
} from "./normalize-published-url";

describe("normalizePublishedUrl", () => {
  it("forces https, strips www, and drops trailing slash", () => {
    expect(normalizePublishedUrl("http://www.Example.com/blog/post/")).toEqual({
      canonical: "https://example.com/blog/post",
      host: "example.com",
      path: "/blog/post",
    });
  });

  it("strips tracking params and keeps sorted non-tracking query", () => {
    const n = normalizePublishedUrl(
      "https://example.com/a?b=2&utm_source=x&fbclid=1&a=1"
    );
    expect(n?.canonical).toBe("https://example.com/a?a=1&b=2");
  });

  it("accepts bare host without protocol", () => {
    expect(normalizePublishedUrl("xoopa.app/docs")).toEqual({
      canonical: "https://xoopa.app/docs",
      host: "xoopa.app",
      path: "/docs",
    });
  });

  it("returns null for unusable input", () => {
    expect(normalizePublishedUrl("")).toBeNull();
    expect(normalizePublishedUrl("not a url")).toBeNull();
    expect(normalizePublishedUrl("ftp://example.com")).toBeNull();
  });
});

describe("matchPublishedAgainstCited", () => {
  const published = normalizePublishedUrl("https://www.xoopa.app/guides/geo/")!;

  it("matches exact host+path ignoring tracking noise", () => {
    expect(
      matchPublishedAgainstCited(
        published,
        "http://xoopa.app/guides/geo?utm_campaign=x"
      )
    ).toBe("EXACT");
  });

  it("returns DOMAIN when host matches but path differs", () => {
    expect(
      matchPublishedAgainstCited(published, "https://xoopa.app/other")
    ).toBe("DOMAIN");
  });

  it("returns null for different hosts", () => {
    expect(
      matchPublishedAgainstCited(published, "https://other.app/guides/geo")
    ).toBeNull();
  });
});

describe("bestMatchAgainstCitedUrls", () => {
  it("prefers EXACT over DOMAIN in the same list", () => {
    expect(
      bestMatchAgainstCitedUrls("https://xoopa.app/page", [
        "https://xoopa.app/other",
        "https://xoopa.app/page",
      ])
    ).toBe("EXACT");
  });

  it("returns DOMAIN when only host matches", () => {
    expect(
      bestMatchAgainstCitedUrls("https://xoopa.app/page", [
        "https://xoopa.app/blog",
      ])
    ).toBe("DOMAIN");
  });

  it("returns null when nothing matches", () => {
    expect(
      bestMatchAgainstCitedUrls("https://xoopa.app/page", [
        "https://example.com/page",
      ])
    ).toBeNull();
  });
});
