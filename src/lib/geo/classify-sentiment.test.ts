import { describe, expect, it } from "vitest";
import {
  DEFAULT_SENTIMENT_MODEL,
  parseSentimentLabel,
} from "@/lib/geo/classify-sentiment";

describe("classifyMentionSentiment helpers", () => {
  it("defaults to gpt-4o-mini for cheap classification", () => {
    expect(DEFAULT_SENTIMENT_MODEL).toBe("gpt-4o-mini");
  });

  it("parses strict JSON labels", () => {
    expect(parseSentimentLabel('{"sentiment":"positive"}')).toBe("positive");
    expect(parseSentimentLabel('{"sentiment":"neutral"}')).toBe("neutral");
    expect(parseSentimentLabel('{"sentiment":"negative"}')).toBe("negative");
  });

  it("rejects unknown labels instead of defaulting to neutral", () => {
    expect(parseSentimentLabel('{"sentiment":"mixed"}')).toBeNull();
    expect(parseSentimentLabel("not json")).toBeNull();
    expect(parseSentimentLabel("{}")).toBeNull();
  });
});
