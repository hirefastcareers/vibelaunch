import { describe, expect, it } from "vitest";
import { parseRobotsDisallows } from "./fetch-page-for-analysis";

describe("parseRobotsDisallows", () => {
  it("reads User-agent: * Disallow rules only", () => {
    const body = `
User-agent: Googlebot
Disallow: /private

User-agent: *
Disallow: /admin
Disallow: /tmp/
Allow: /

User-agent: Bingbot
Disallow: /
`;
    expect(parseRobotsDisallows(body)).toEqual(["/admin", "/tmp/"]);
  });

  it("returns empty when * has no disallows", () => {
    expect(parseRobotsDisallows("User-agent: *\nAllow: /\n")).toEqual([]);
  });
});
