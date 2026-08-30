/** Demo user for JWT auth in standalone preview mode */
export const DEMO_USER = {
  id: "demo-user-id",
  name: "Demo Founder",
  email: "demo@vibelaunch.app",
  xUsername: "demo_founder",
  image: null,
};

/** Scraped project context returned by /api/project/onboard in demo mode */
export const MOCK_SCRAPED_CONTEXT = {
  title: "VibeLaunch",
  description:
    "VibeLaunch — Autonomous Indie Growth Engine. Schedule X posts, track ERI analytics, generate adaptive AI content, and publish SEO changelogs from one command center.",
  tagline: "Autonomous Indie Growth Engine",
  keywords: ["vibelaunch", "build-in-public", "indie-hacker", "x-growth", "seo"],
};

export const MOCK_PROJECT = {
  id: "demo-project-vibelaunch",
  name: "VibeLaunch",
  slug: "vibelaunch",
  websiteUrl: "https://vibelaunch.app",
  description: MOCK_SCRAPED_CONTEXT.description,
  tagline: MOCK_SCRAPED_CONTEXT.tagline,
  tone: "build-in-public",
  keywords: MOCK_SCRAPED_CONTEXT.keywords,
  status: "ACTIVE" as const,
};

const previewImage = (type: "video" | "code") =>
  `/api/media/generate?type=${type === "video" ? "video" : "code-card"}&id=demo`;

export const MOCK_QUEUE = {
  pending: [
    {
      id: "demo-pending-1",
      content:
        "Working on adaptive AI threads that learn from your top ERI posts. The generator pulls from vector-reinforced embeddings — early tests look promising 👀",
      status: "DRAFT",
      mediaUrls: [] as string[],
      scheduledAt: null as string | null,
      publishedAt: null as string | null,
      projectId: MOCK_PROJECT.id,
      projectName: "VibeLaunch",
      eri: null as number | null,
      xPostUrl: null as string | null,
    },
    {
      id: "demo-pending-2",
      content:
        "Draft: Why ERI beats raw impressions for indie launches. Thread outline: 1) vanity metrics 2) engagement index 3) vector learning loop",
      status: "QUEUED",
      mediaUrls: [previewImage("code")],
      scheduledAt: null,
      publishedAt: null,
      projectId: MOCK_PROJECT.id,
      projectName: "VibeLaunch",
      eri: null,
      xPostUrl: null,
    },
    {
      id: "demo-pending-3",
      content:
        "Screenshot thread idea: Command Center dashboard with impression velocity + follower growth trajectory. Visual proof > claims.",
      status: "DRAFT",
      mediaUrls: [previewImage("video")],
      scheduledAt: null,
      publishedAt: null,
      projectId: MOCK_PROJECT.id,
      projectName: "VibeLaunch",
      eri: null,
      xPostUrl: null,
    },
  ],
  scheduled: [
    {
      id: "demo-scheduled-1",
      content:
        "🧵 Thread (1/5): How we built VibeLaunch's post queue — QStash scheduling, media engine, and one-click X publish. A build-in-public breakdown:",
      status: "SCHEDULED",
      mediaUrls: [previewImage("video")],
      scheduledAt: new Date(Date.now() + 1 * 86400000).toISOString(),
      publishedAt: null,
      projectId: MOCK_PROJECT.id,
      projectName: "VibeLaunch",
      eri: null,
      xPostUrl: null,
    },
    {
      id: "demo-scheduled-2",
      content:
        "🧵 Thread (1/4): SEO changelog pipeline — AI expander → /changelog/[slug] → sitemap → Google indexing. Full walkthrough with code snippets:",
      status: "SCHEDULED",
      mediaUrls: [previewImage("code")],
      scheduledAt: new Date(Date.now() + 3 * 86400000).toISOString(),
      publishedAt: null,
      projectId: MOCK_PROJECT.id,
      projectName: "VibeLaunch",
      eri: null,
      xPostUrl: null,
    },
  ],
  published: [
    {
      id: "demo-published-1",
      content:
        "Just shipped v2 of VibeLaunch — adaptive AI posts, ERI analytics, and SEO changelogs. Building in public hits different 🚀",
      status: "PUBLISHED",
      mediaUrls: [previewImage("video")],
      scheduledAt: null,
      publishedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      projectId: MOCK_PROJECT.id,
      projectName: "VibeLaunch",
      eri: 8.75,
      xPostUrl: "https://x.com/demo_founder/status/1001",
    },
    {
      id: "demo-published-2",
      content:
        "Hot take: your launch thread matters more than your landing page in week 1. Ship the narrative first.",
      status: "PUBLISHED",
      mediaUrls: [] as string[],
      scheduledAt: null,
      publishedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      projectId: MOCK_PROJECT.id,
      projectName: "VibeLaunch",
      eri: 6.2,
      xPostUrl: "https://x.com/demo_founder/status/1002",
    },
    {
      id: "demo-published-3",
      content:
        "ERI > vanity metrics. We built VibeLaunch to optimize for engagement rate index, not just impressions.",
      status: "PUBLISHED",
      mediaUrls: [previewImage("code")],
      scheduledAt: null,
      publishedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      projectId: MOCK_PROJECT.id,
      projectName: "VibeLaunch",
      eri: 5.4,
      xPostUrl: "https://x.com/demo_founder/status/1003",
    },
    {
      id: "demo-published-4",
      content:
        "Day 30 build update: 3 SEO changelog pages indexed, avg ERI up 40% since enabling vector reinforcement.",
      status: "PUBLISHED",
      mediaUrls: [] as string[],
      scheduledAt: null,
      publishedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      projectId: MOCK_PROJECT.id,
      projectName: "VibeLaunch",
      eri: 4.1,
      xPostUrl: "https://x.com/demo_founder/status/1004",
    },
    {
      id: "demo-published-5",
      content:
        "Smart Reply Assistant is live — monitors #buildinpublic feeds and drafts context-aware replies. No spam, just value.",
      status: "PUBLISHED",
      mediaUrls: [previewImage("video")],
      scheduledAt: null,
      publishedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      projectId: MOCK_PROJECT.id,
      projectName: "VibeLaunch",
      eri: 3.8,
      xPostUrl: "https://x.com/demo_founder/status/1005",
    },
  ],
};

export const MOCK_ANALYTICS = {
  stats: {
    impressionsVelocity: 18400,
    totalImpressions: 124800,
    avgEri: 5.6,
    seoPagesPublished: 3,
    postCount: 10,
    publishedCount: 5,
  },
  topPosts: [...MOCK_QUEUE.published]
    .sort((a, b) => (b.eri ?? 0) - (a.eri ?? 0))
    .map((p) => ({
      id: p.id,
      content: p.content,
      eri: p.eri ?? 0,
      impressions: Math.round((p.eri ?? 0) * 1600),
      likes: Math.round((p.eri ?? 0) * 40),
      publishedAt: p.publishedAt,
      xPostUrl: p.xPostUrl,
      mediaUrls: p.mediaUrls,
    })),
  followerGrowth: Array.from({ length: 14 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (13 - i));
    return {
      date: date.toISOString().split("T")[0],
      followers: 380 + i * 42 + Math.floor(i * i * 2),
      eri: 1.8 + i * 0.28,
    };
  }),
  projects: [{ id: MOCK_PROJECT.id, name: MOCK_PROJECT.name }],
};

export const MOCK_X_THREAD = {
  thread: [
    "🧵 Launch threads that convert — a VibeLaunch playbook (1/4)",
    "Start with the problem, not the product. Your audience scrolls past feature lists. Lead with the pain you felt building.",
    "Show proof early: metrics, screenshots, or a 15s demo clip. Impression velocity spikes when media is attached.",
    "End with one CTA. Not three links. One next step. Track ERI on each post and let the vector store learn what works.",
  ],
  tone: "build-in-public",
  inspiredBy: ["demo-published-1", "demo-published-2"],
};

export const MOCK_GENERATED_POST = {
  content:
    "🚀 Shipped adaptive AI content in VibeLaunch — your highest-ERI posts now train the generator. Launch smarter, not louder.",
  tone: "casual",
  inspiredBy: ["demo-published-1", "demo-published-3"],
};

export const MOCK_CRON_ANALYTICS = {
  eri: { processed: 5, snapshots: 1, errors: [] as string[] },
  reinforced: 3,
  ranAt: new Date().toISOString(),
};

export const MOCK_SEO_PUBLISH = {
  entry: {
    id: "demo-changelog-1",
    projectId: MOCK_PROJECT.id,
    slug: "v2-adaptive-ai-launch",
    title: "v2.0 — Adaptive AI Launch Engine",
    summary: "Vector-reinforced content generation and ERI analytics are now live.",
    body: "## v2.0 Release\n\nAdaptive AI content generation powered by high-ERI vector reinforcement.",
    seoTitle: "v2.0 Adaptive AI | VibeLaunch Changelog",
    seoDesc: "Vector-reinforced content generation and ERI analytics are now live in VibeLaunch.",
    keywords: ["vibelaunch", "changelog", "adaptive-ai", "eri"],
    published: true,
    publishedAt: new Date().toISOString(),
    indexedAt: new Date().toISOString(),
  },
  url: "https://vibelaunch.app/changelog/v2-adaptive-ai-launch",
  indexing: { success: true },
};

export const MOCK_SMART_REPLIES_FEED: Record<
  string,
  Array<{
    id: string;
    author: string;
    content: string;
    url: string;
    suggestedReply: string;
  }>
> = {
  "#buildinpublic": [
    {
      id: "1",
      author: "@indie_dev",
      content:
        "Just hit $1k MRR on my micro-SaaS after 6 months of building in public. Here's what worked...",
      url: "https://x.com/indie_dev/status/1",
      suggestedReply:
        "Congrats on the milestone! Curious — what was the single channel that drove the most signups in month one?",
    },
    {
      id: "2",
      author: "@founder_j",
      content:
        "Day 47 of shipping daily updates. Engagement is up 3x since I started sharing metrics openly.",
      url: "https://x.com/founder_j/status/2",
      suggestedReply:
        "The consistency compound effect is real. We track ERI weekly and the transparency posts always outperform feature drops.",
    },
    {
      id: "3",
      author: "@saas_starter",
      content:
        "Anyone else finding that transparent roadmap posts get more traction than feature announcements?",
      url: "https://x.com/saas_starter/status/3",
      suggestedReply:
        "100%. Roadmap posts invite conversation; feature posts feel like ads. We lead with the 'why' and attach a quick demo clip.",
    },
  ],
  vibecoding: [
    {
      id: "4",
      author: "@vibe_builder",
      content:
        "Used AI to scaffold my entire auth flow in 20 minutes. Now polishing the edges for production.",
      url: "https://x.com/vibe_builder/status/4",
      suggestedReply:
        "Same workflow here — AI for scaffolding, tests for guardrails. The last 20% (sessions, edge cases) is where the real work lives.",
    },
    {
      id: "5",
      author: "@code_vibes",
      content:
        "Hot take: vibe coding works best when you have strong tests as guardrails.",
      url: "https://x.com/code_vibes/status/5",
      suggestedReply:
        "Agreed. We treat AI output as a first draft, not a deploy. ERI on launch posts helps validate the narrative before you scale it.",
    },
  ],
  "micro-saas": [
    {
      id: "6",
      author: "@micro_founder",
      content:
        "Launched a $9/mo tool that saves founders 2hrs/week on X scheduling. Small but profitable.",
      url: "https://x.com/micro_founder/status/6",
      suggestedReply:
        "Love the niche focus. $9/mo with a clear time-saving promise is a great wedge — how are you handling churn so far?",
    },
    {
      id: "7",
      author: "@tiny_saas",
      content:
        "What's the smallest SaaS you've seen succeed? I love these niche tool stories.",
      url: "https://x.com/tiny_saas/status/7",
      suggestedReply:
        "Tools that solve one painful workflow for a specific audience. VibeLaunch started as 'just X scheduling' before expanding to SEO + analytics.",
    },
  ],
};

export const MOCK_AI_REPLY =
  "Love this approach — tracking ERI instead of raw impressions changed how we prioritize content. The compound effect over 30 days is real.";
