import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const KEYWORD_FEEDS: Record<string, Array<{ id: string; author: string; content: string; url: string }>> = {
  "#buildinpublic": [
    { id: "1", author: "@indie_dev", content: "Just hit $1k MRR on my micro-SaaS after 6 months of building in public. Here's what worked...", url: "https://x.com" },
    { id: "2", author: "@founder_j", content: "Day 47 of shipping daily updates. Engagement is up 3x since I started sharing metrics openly.", url: "https://x.com" },
    { id: "3", author: "@saas_starter", content: "Anyone else finding that transparent roadmap posts get more traction than feature announcements?", url: "https://x.com" },
  ],
  "vibecoding": [
    { id: "4", author: "@vibe_builder", content: "Used AI to scaffold my entire auth flow in 20 minutes. Now polishing the edges for production.", url: "https://x.com" },
    { id: "5", author: "@code_vibes", content: "Hot take: vibe coding works best when you have strong tests as guardrails.", url: "https://x.com" },
  ],
  "micro-saas": [
    { id: "6", author: "@micro_founder", content: "Launched a $9/mo tool that saves founders 2hrs/week on X scheduling. Small but profitable.", url: "https://x.com" },
    { id: "7", author: "@tiny_saas", content: "What's the smallest SaaS you've seen succeed? I love these niche tool stories.", url: "https://x.com" },
  ],
};

export async function GET() {
  return NextResponse.json({ feeds: KEYWORD_FEEDS });
}
