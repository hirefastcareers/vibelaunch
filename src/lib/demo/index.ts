/**
 * Demo/preview mode — auto-enabled when DATABASE_URL is missing or DEMO_MODE=true.
 * Lets Vercel previews load without real Postgres, OAuth, or API keys.
 */
export function isDemoMode(): boolean {
  if (process.env.DEMO_MODE === "true") return true;
  if (process.env.DEMO_MODE === "false") return false;
  const db = process.env.DATABASE_URL?.trim();
  return !db || db.includes("user:password@localhost") || db.includes("placeholder");
}

export const DEMO_USER = {
  id: "demo-user-id",
  name: "Demo Founder",
  email: "demo@vibelaunch.app",
  xUsername: "demo_founder",
  image: null,
};

export const DEMO_PROJECTS = [
  {
    id: "demo-project-1",
    name: "VibeLaunch",
    slug: "vibelaunch",
    tagline: "Launch on X. Grow with SEO.",
    description: "AI-powered launch platform for indie founders.",
    status: "ACTIVE" as const,
    tone: "build-in-public",
    keywords: ["saas", "launch", "x"],
    _count: { posts: 12, changelog: 3 },
    analytics: [{ avgEri: 4.2, snapshotAt: new Date() }],
  },
  {
    id: "demo-project-2",
    name: "MicroSaaS Kit",
    slug: "microsaas-kit",
    tagline: "Ship your SaaS in a weekend.",
    description: "Starter kit for micro-SaaS founders.",
    status: "LAUNCHED" as const,
    tone: "technical",
    keywords: ["micro-saas", "starter"],
    _count: { posts: 8, changelog: 2 },
    analytics: [{ avgEri: 2.8, snapshotAt: new Date() }],
  },
];

export const DEMO_STATS = {
  stats: {
    impressionsVelocity: 12400,
    totalImpressions: 89200,
    avgEri: 4.2,
    seoPagesPublished: 3,
    postCount: 20,
    publishedCount: 15,
  },
  topPosts: [
    {
      id: "demo-post-1",
      content: "Just shipped v2 of VibeLaunch — adaptive AI posts, ERI analytics, and SEO changelogs. Building in public hits different 🚀",
      eri: 8.75,
      impressions: 14200,
      likes: 340,
      publishedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      xPostUrl: "https://x.com/demo_founder/status/1",
      mediaUrls: ["/api/media/generate?type=video"],
    },
    {
      id: "demo-post-2",
      content: "Hot take: your launch thread matters more than your landing page in week 1. Ship the narrative first.",
      eri: 5.1,
      impressions: 8700,
      likes: 210,
      publishedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      xPostUrl: "https://x.com/demo_founder/status/2",
      mediaUrls: [],
    },
    {
      id: "demo-post-3",
      content: "ERI > vanity metrics. We built VibeLaunch to optimize for engagement rate index, not just impressions.",
      eri: 3.4,
      impressions: 5200,
      likes: 98,
      publishedAt: new Date(Date.now() - 8 * 86400000).toISOString(),
      xPostUrl: "https://x.com/demo_founder/status/3",
      mediaUrls: ["/api/media/generate?type=code-card&id=demo"],
    },
  ],
  followerGrowth: Array.from({ length: 14 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (13 - i));
    return {
      date: date.toISOString().split("T")[0],
      followers: 420 + i * 35 + Math.floor(i * i * 1.5),
      eri: 2 + i * 0.15,
    };
  }),
  projects: DEMO_PROJECTS.map((p) => ({ id: p.id, name: p.name })),
};

export const DEMO_QUEUE = {
  pending: [
    {
      id: "demo-q-1",
      content: "Working on something new — AI-generated launch threads that learn from your best posts. Stay tuned 👀",
      status: "DRAFT",
      mediaUrls: [],
      scheduledAt: null,
      publishedAt: null,
      projectId: "demo-project-1",
      projectName: "VibeLaunch",
      eri: null,
      xPostUrl: null,
    },
  ],
  scheduled: [
    {
      id: "demo-q-2",
      content: "Weekly build update: ERI analytics cron is live, vector reinforcement is learning from top posts.",
      status: "SCHEDULED",
      mediaUrls: ["/api/media/generate?type=code-card&id=snippet"],
      scheduledAt: new Date(Date.now() + 2 * 86400000).toISOString(),
      publishedAt: null,
      projectId: "demo-project-1",
      projectName: "VibeLaunch",
      eri: null,
      xPostUrl: null,
    },
  ],
  published: DEMO_STATS.topPosts.map((p) => ({
    id: p.id,
    content: p.content,
    status: "PUBLISHED",
    mediaUrls: p.mediaUrls,
    scheduledAt: null,
    publishedAt: p.publishedAt,
    projectId: "demo-project-1",
    projectName: "VibeLaunch",
    eri: p.eri,
    xPostUrl: p.xPostUrl,
  })),
};

export const DEMO_GENERATED = {
  content: "🚀 Shipped a major update today — adaptive AI content that learns from your highest-ERI posts. Your launch just got smarter.",
  tone: "casual",
  inspiredBy: ["demo-post-1", "demo-post-2"],
};

export const DEMO_REPLY =
  "Love this approach — we saw similar results tracking ERI instead of raw impressions. The compound effect over 30 days is real.";
