/** Demo user for JWT auth in standalone preview mode */
export const DEMO_USER = {
  id: "demo-user-id",
  name: "Demo Founder",
  email: "demo@sorano.app",
  xUsername: "demo_founder",
  image: null,
};

/** Scraped project context returned by /api/project/onboard in demo mode */
export const MOCK_SCRAPED_CONTEXT = {
  title: "Sorano",
  description:
    "Sorano - Autonomous Growth for Indie Builders. Turn your product updates into viral social posts, Google-ranked articles, and AI search recommendations - automatically.",
  tagline: "Autonomous Growth for Indie Builders",
  keywords: ["sorano", "build-in-public", "indie-hacker", "x-growth", "seo"],
};

export const MOCK_PROJECT = {
  id: "demo-project-sorano",
  name: "Sorano",
  slug: "sorano",
  websiteUrl: "https://sorano.app",
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
        "Working on adaptive AI threads that learn from your top ERI posts. The generator pulls from vector-reinforced embeddings - early tests look promising 👀",
      status: "DRAFT",
      mediaUrls: [] as string[],
      scheduledAt: null as string | null,
      publishedAt: null as string | null,
      projectId: MOCK_PROJECT.id,
      projectName: "Sorano",
      eri: null as number | null,
      xPostUrl: null as string | null,
    },
    {
      id: "demo-pending-failed",
      content:
        "Tried to ship the v1.4 capture thread automatically. Publish stopped because the X session needs a reconnect.",
      status: "FAILED",
      mediaUrls: [] as string[],
      scheduledAt: null as string | null,
      publishedAt: null as string | null,
      projectId: MOCK_PROJECT.id,
      projectName: "Sorano",
      eri: null as number | null,
      xPostUrl: null as string | null,
      errorMessage:
        "[AUTH:REAUTH_REQUIRED] X session expired and cannot be refreshed automatically",
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
      projectName: "Sorano",
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
      projectName: "Sorano",
      eri: null,
      xPostUrl: null,
    },
  ],
  scheduled: [
    {
      id: "demo-scheduled-1",
      content:
        "🧵 Thread (1/5): How we built Sorano's post queue - QStash scheduling, media engine, and one-click X publish. A build-in-public breakdown:",
      status: "SCHEDULED",
      mediaUrls: [previewImage("video")],
      scheduledAt: new Date(Date.now() + 1 * 86400000).toISOString(),
      publishedAt: null,
      projectId: MOCK_PROJECT.id,
      projectName: "Sorano",
      eri: null,
      xPostUrl: null,
    },
    {
      id: "demo-scheduled-2",
      content:
        "🧵 Thread (1/4): SEO changelog pipeline - AI expander → /changelog/[slug] → sitemap → Google indexing. Full walkthrough with code snippets:",
      status: "SCHEDULED",
      mediaUrls: [previewImage("code")],
      scheduledAt: new Date(Date.now() + 3 * 86400000).toISOString(),
      publishedAt: null,
      projectId: MOCK_PROJECT.id,
      projectName: "Sorano",
      eri: null,
      xPostUrl: null,
    },
  ],
  published: [
    {
      id: "demo-published-1",
      content:
        "Just shipped v2 of Sorano - adaptive AI posts, ERI analytics, and SEO changelogs. Building in public hits different 🚀",
      status: "PUBLISHED",
      mediaUrls: [previewImage("video")],
      scheduledAt: null,
      publishedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      projectId: MOCK_PROJECT.id,
      projectName: "Sorano",
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
      projectName: "Sorano",
      eri: 6.2,
      xPostUrl: "https://x.com/demo_founder/status/1002",
    },
    {
      id: "demo-published-3",
      content:
        "ERI > vanity metrics. We built Sorano to optimize for engagement rate index, not just impressions.",
      status: "PUBLISHED",
      mediaUrls: [previewImage("code")],
      scheduledAt: null,
      publishedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      projectId: MOCK_PROJECT.id,
      projectName: "Sorano",
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
      projectName: "Sorano",
      eri: 4.1,
      xPostUrl: "https://x.com/demo_founder/status/1004",
    },
    {
      id: "demo-published-5",
      content:
        "Smart Reply Assistant is live - monitors #buildinpublic feeds and drafts context-aware replies. No spam, just value.",
      status: "PUBLISHED",
      mediaUrls: [previewImage("video")],
      scheduledAt: null,
      publishedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      projectId: MOCK_PROJECT.id,
      projectName: "Sorano",
      eri: 3.8,
      xPostUrl: "https://x.com/demo_founder/status/1005",
    },
  ],
};

function mockDay(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split("T")[0];
}

export const MOCK_ANALYTICS = {
  stats: {
    impressionsVelocity: 18400,
    totalImpressions: 124800,
    avgEri: 5.6,
    seoPagesPublished: 3,
    postCount: 10,
    publishedCount: 5,
    impressionsTrend: 14.2,
    eriTrendPct: 8.7,
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
  eriTrend: [
    { date: mockDay(27), eri: 3.1 },
    { date: mockDay(23), eri: 3.45 },
    { date: mockDay(19), eri: 3.8 },
    { date: mockDay(15), eri: 4.2 },
    { date: mockDay(11), eri: 4.55 },
    { date: mockDay(7), eri: 4.9 },
    { date: mockDay(4), eri: 5.15 },
    { date: mockDay(1), eri: 5.6 },
  ],
  projects: [{ id: MOCK_PROJECT.id, name: MOCK_PROJECT.name }],
};

export const MOCK_X_THREAD = {
  thread: [
    "🧵 Launch threads that convert - a Sorano playbook (1/4)",
    "Start with the problem, not the product. Your audience scrolls past feature lists. Lead with the pain you felt building.",
    "Show proof early: metrics, screenshots, or a 15s demo clip. Impression velocity spikes when media is attached.",
    "End with one CTA. Not three links. One next step. Track ERI on each post and let the vector store learn what works.",
  ],
  tone: "build-in-public",
  inspiredBy: ["demo-published-1", "demo-published-2"],
};

export const MOCK_GENERATED_POST = {
  content:
    "🚀 Shipped adaptive AI content in Sorano - your highest-ERI posts now train the generator. Launch smarter, not louder.",
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
    title: "v2.0 - Adaptive AI Launch Engine",
    summary: "Vector-reinforced content generation and ERI analytics are now live.",
    body: "## v2.0 Release\n\nAdaptive AI content generation powered by high-ERI vector reinforcement.",
    seoTitle: "v2.0 Adaptive AI | Sorano Changelog",
    seoDesc: "Vector-reinforced content generation and ERI analytics are now live in Sorano.",
    keywords: ["sorano", "changelog", "adaptive-ai", "eri"],
    published: true,
    publishedAt: new Date().toISOString(),
    indexedAt: new Date().toISOString(),
  },
  url: "https://sorano.app/changelog/v2-adaptive-ai-launch",
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
        "Congrats on the milestone! Curious - what was the single channel that drove the most signups in month one?",
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
        "Same workflow here - AI for scaffolding, tests for guardrails. The last 20% (sessions, edge cases) is where the real work lives.",
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
        "Love the niche focus. $9/mo with a clear time-saving promise is a great wedge - how are you handling churn so far?",
    },
    {
      id: "7",
      author: "@tiny_saas",
      content:
        "What's the smallest SaaS you've seen succeed? I love these niche tool stories.",
      url: "https://x.com/tiny_saas/status/7",
      suggestedReply:
        "Tools that solve one painful workflow for a specific audience. Sorano started as 'just X scheduling' before expanding to SEO + analytics.",
    },
  ],
};

export const MOCK_AI_REPLY =
  "Love this approach - tracking ERI instead of raw impressions changed how we prioritize content. The compound effect over 30 days is real.";

const geoCheckedAt = new Date().toISOString();

export const MOCK_GEO_METRICS = [
  {
    id: "geo-1",
    queryPrompt: "Best vibe coding tools for indie hackers",
    cited: true,
    citationUrl: "https://sorano.app",
    llmProvider: "perplexity",
    checkedAt: geoCheckedAt,
  },
  {
    id: "geo-2",
    queryPrompt: "Best vibe coding tools for indie hackers",
    cited: true,
    citationUrl: "https://sorano.app",
    llmProvider: "chatgpt",
    checkedAt: geoCheckedAt,
  },
  {
    id: "geo-3",
    queryPrompt: "Best vibe coding tools for indie hackers",
    cited: false,
    citationUrl: null,
    llmProvider: "claude",
    checkedAt: geoCheckedAt,
  },
  {
    id: "geo-4",
    queryPrompt: "Top tools for sorano",
    cited: true,
    citationUrl: "https://sorano.app",
    llmProvider: "perplexity",
    checkedAt: geoCheckedAt,
  },
  {
    id: "geo-5",
    queryPrompt: "Top tools for sorano",
    cited: false,
    citationUrl: null,
    llmProvider: "chatgpt",
    checkedAt: geoCheckedAt,
  },
  {
    id: "geo-6",
    queryPrompt: "Top tools for sorano",
    cited: false,
    citationUrl: null,
    llmProvider: "claude",
    checkedAt: geoCheckedAt,
  },
  {
    id: "geo-7",
    queryPrompt: "What are the best sorano alternatives? How does Sorano compare?",
    cited: true,
    citationUrl: "https://sorano.app",
    llmProvider: "perplexity",
    checkedAt: geoCheckedAt,
  },
  {
    id: "geo-8",
    queryPrompt: "What are the best sorano alternatives? How does Sorano compare?",
    cited: true,
    citationUrl: "https://sorano.app",
    llmProvider: "chatgpt",
    checkedAt: geoCheckedAt,
  },
  {
    id: "geo-9",
    queryPrompt: "What are the best sorano alternatives? How does Sorano compare?",
    cited: false,
    citationUrl: null,
    llmProvider: "claude",
    checkedAt: geoCheckedAt,
  },
];

export const MOCK_GEO = {
  projectId: MOCK_PROJECT.id,
  projectName: MOCK_PROJECT.name,
  citationScore: 55.6,
  byProvider: {
    perplexity: { cited: 3, total: 3, label: "Perplexity" },
    chatgpt: { cited: 2, total: 3, label: "ChatGPT" },
    claude: { cited: 0, total: 3, label: "Claude" },
  },
  recentMetrics: MOCK_GEO_METRICS.slice(0, 9),
  suggestions: [
    "Add FAQ schema with direct Q&A pairs - Claude retrieval favors FAQPage JSON-LD on changelog pages.",
    "Publish benchmark data or usage stats - ChatGPT citations increase when pages contain specific, verifiable numbers.",
    'Create content targeting: "Top tools for sorano" - you\'re not yet cited for this high-intent query.',
  ],
  citationTrend: [
    { date: "2026-07-27", perplexity: 66.7, chatgpt: 33.3 },
    { date: "2026-08-03", perplexity: 66.7, chatgpt: 33.3, claude: 0 },
    { date: "2026-08-10", perplexity: 100, chatgpt: 33.3, claude: 0 },
    { date: "2026-08-17", perplexity: 100, chatgpt: 66.7, claude: 0 },
    { date: "2026-08-24", perplexity: 100, chatgpt: 66.7 },
    { date: "2026-08-31", perplexity: 100, chatgpt: 66.7, claude: 0 },
  ],
};

export const MOCK_GEO_CHECK = {
  projectId: MOCK_PROJECT.id,
  projectName: MOCK_PROJECT.name,
  checkedAt: geoCheckedAt,
  metrics: MOCK_GEO_METRICS.map((m) => ({
    queryPrompt: m.queryPrompt,
    llmProvider: m.llmProvider,
    cited: m.cited,
    citationUrl: m.citationUrl,
    responseSnippet: m.cited
      ? "Sorano (https://sorano.app) - autonomous indie growth engine..."
      : "Popular tools include Buffer, Hypefury, and Taplio...",
  })),
  citationScore: MOCK_GEO.citationScore,
  byProvider: MOCK_GEO.byProvider,
  recentMetrics: MOCK_GEO.recentMetrics,
  suggestions: MOCK_GEO.suggestions,
  citationTrend: MOCK_GEO.citationTrend,
};

const diagExecutedAt = new Date().toISOString();

const mockSuite = (
  suite: string,
  status: string,
  score: number,
  summary: string
) => ({
  id: `diag-${suite}`,
  suite,
  status,
  score,
  details: { summary, assertions: [], durationMs: 120 },
  executedAt: diagExecutedAt,
});

export const MOCK_DIAGNOSTICS = {
  projectId: MOCK_PROJECT.id,
  projectName: MOCK_PROJECT.name,
  overallScore: 82.5,
  overallStatus: "passed",
  runs: [
    mockSuite("seo_audit", "passed", 90, "4/4 checks passed - Google indexing looks good"),
    mockSuite("feedback_loop", "warning", 75, "3/4 checks passed - still learning from viral posts"),
    mockSuite("media_render", "passed", 100, "5/5 checks passed - videos and code cards render cleanly"),
    mockSuite("geo_audit", "warning", 65, "4/6 checks passed - cited in some AI searches"),
  ],
  history: [],
};

export const MOCK_DIAGNOSTICS_RUN = {
  projectId: MOCK_PROJECT.id,
  projectName: MOCK_PROJECT.name,
  overallScore: 82.5,
  overallStatus: "passed",
  suites: MOCK_DIAGNOSTICS.runs.map((r) => ({
    suite: r.suite,
    status: r.status,
    score: r.score,
    details: r.details,
  })),
  executedAt: diagExecutedAt,
};

export const MOCK_DIAGNOSTICS_CRON = {
  processed: 1,
  results: [MOCK_DIAGNOSTICS_RUN],
};
