import { describe, expect, it } from "vitest";
import { detectBrandMention } from "@/lib/geo/brand-mention";

/**
 * Unit-level checks for the competitor detection strategy used by
 * buildCompetitorComparison: re-run detectBrandMention on captured text.
 */
describe("competitor detection reuse", () => {
  it("finds a competitor name in a captured raw response", () => {
    const raw =
      "For indie CRM, founders often mention HubSpot and Salesforce alongside niche tools.";
    expect(detectBrandMention(raw, "HubSpot")).toBe(true);
    expect(detectBrandMention(raw, "Salesforce")).toBe(true);
    expect(detectBrandMention(raw, "Xoopa")).toBe(false);
  });

  it("does not invent a mention when the response is empty", () => {
    expect(detectBrandMention("", "HubSpot")).toBe(false);
    expect(detectBrandMention("   ", "HubSpot")).toBe(false);
  });

  it("handles common brand variants without fabricating", () => {
    expect(detectBrandMention("Try HubSpot for marketing.", "Hub Spot")).toBe(
      true
    );
    expect(detectBrandMention("No CRMs listed here.", "HubSpot")).toBe(false);
  });
});
