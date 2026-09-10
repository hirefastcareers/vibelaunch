import { describe, expect, it } from "vitest";
import { extractUrlsFromText, uniqueUrls } from "./types";

describe("model-runner helpers", () => {
  it("dedupes and keeps only http(s) urls", () => {
    expect(
      uniqueUrls([
        "https://xoopa.app",
        "https://xoopa.app",
        "not-a-url",
        "http://example.com/path",
        null,
      ])
    ).toEqual(["https://xoopa.app", "http://example.com/path"]);
  });

  it("extracts urls from prose and strips trailing punctuation", () => {
    expect(
      extractUrlsFromText("See https://xoopa.app/docs, and https://example.com).")
    ).toEqual(["https://xoopa.app/docs", "https://example.com"]);
  });
});
