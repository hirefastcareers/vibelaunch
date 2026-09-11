import { describe, expect, it } from "vitest";
import {
  buildFallbackPost,
  buildPostPrompt,
  cleanGeneratedPost,
} from "./post-voice";

describe("cleanGeneratedPost", () => {
  it("strips slogans, emojis, and hashtags from launch slop", () => {
    const cleaned = cleanGeneratedPost(
      "🚀 Exciting news! X sign-in is now live on Xoopa! 🎉 Effortlessly turn your product updates into viral posts, Google-ranked articles, and smart AI recommendations—all automatically! Let’s make your updates shine! 💥 #Xoopa #ProductUpdates #Automation",
    );

    expect(cleaned).not.toMatch(/#/);
    expect(cleaned).not.toMatch(/Exciting news/i);
    expect(cleaned).not.toMatch(/viral/i);
    expect(cleaned).not.toMatch(/effortlessly/i);
    expect(cleaned).not.toMatch(/[🚀🎉💥]/);
    expect(cleaned.toLowerCase()).toContain("x sign-in is now live on xoopa");
  });

  it("unwraps quoted model output", () => {
    expect(cleanGeneratedPost('"X sign-in is live on Xoopa."')).toBe(
      "X sign-in is live on Xoopa.",
    );
  });
});

describe("buildPostPrompt", () => {
  it("asks for changelog language and includes the golden example", () => {
    const prompt = buildPostPrompt({
      name: "Xoopa",
      tagline: "Ship once. Get found everywhere.",
      description: "Autonomous X + SEO + GEO loop",
      topic: "X sign-in is live",
      tone: "casual",
      examples: "",
    });

    expect(prompt).toContain("X sign-in is live on Xoopa. Connect X once");
    expect(prompt).toContain("citeable");
    expect(prompt).toContain("No emojis, hashtags, slogans");
    expect(prompt).toContain("X sign-in is live");
    expect(prompt).toContain("GEO");
    expect(prompt).toContain("Mannered prose substitutes metaphor");
  });
});

describe("buildFallbackPost", () => {
  it("uses the shipped fact and what you can do next", () => {
    expect(
      buildFallbackPost(
        {
          name: "Xoopa",
          tagline:
            "Connect X once, then product updates can become posts and articles without a second tool",
        },
        "X sign-in is live",
      ),
    ).toBe(
      "X sign-in is live on Xoopa. Connect X once, then product updates can become posts and articles without a second tool.",
    );
  });
});
