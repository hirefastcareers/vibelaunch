import { beforeEach, describe, expect, it, vi } from "vitest";
import { deriveShipTitle } from "./schema";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    project: { findFirst: vi.fn(), update: vi.fn() },
    changelogEntry: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    post: { create: vi.fn(), findUnique: vi.fn() },
    geoMetric: { findMany: vi.fn() },
  },
}));

vi.mock("@/lib/billing/limits", () => ({
  assertCanCreatePost: vi.fn(async () => undefined),
  UsageLimitError: class UsageLimitError extends Error {
    code = "POST_LIMIT";
  },
}));

vi.mock("@/lib/generator/adaptive", () => ({
  generateAdaptiveContent: vi.fn(async () => ({
    content: "Shipped X sign-in. Try it from the dashboard.",
    tone: "casual",
    inspiredBy: ["post_1"],
  })),
}));

vi.mock("@/lib/seo/expander", () => ({
  expandForSeo: vi.fn(async () => ({
    seoTitle: "X sign-in is live",
    seoDesc: "Founders can sign in with X.",
    body: "## What shipped\n\nX sign-in.",
    keywords: ["xoopa", "x"],
    slug: "x-sign-in-is-live",
  })),
}));

vi.mock("@/lib/seo/google-indexing", () => ({
  requestGoogleIndexing: vi.fn(async () => ({ success: false, error: "skip" })),
}));

vi.mock("@/lib/media/site-capture", () => ({
  captureSiteScreenshot: vi.fn(async () => ({
    blobUrl: "https://blob.example/captures/site.png",
    capturedAt: new Date("2026-09-08T12:00:00Z"),
  })),
}));

vi.mock("@/lib/media/engine", () => ({
  validateMediaUrls: vi.fn(() => ({ valid: true, errors: [] })),
}));

vi.mock("@/lib/geo/citation-tracker", () => ({
  checkLLMCitations: vi.fn(async () => ({
    projectId: "proj_1",
    metrics: [],
    checkedAt: "2026-09-08T12:00:00.000Z",
  })),
}));

vi.mock("@/lib/geo/analytics", () => ({
  buildGeoDashboardData: vi.fn(() => ({
    citationScore: 33,
    byProvider: {},
    recentMetrics: [],
    suggestions: [],
  })),
  buildCitationTrend: vi.fn(() => []),
}));

vi.mock("@/lib/env", () => ({
  getBaseUrl: () => "https://xoopa.app",
}));

vi.mock("@/lib/queue/dispatch-post", () => ({
  dispatchPostPublish: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { shipUpdate } from "./ship-update";

const findProject = vi.mocked(prisma.project.findFirst);
const updateProject = vi.mocked(prisma.project.update);
const findSlug = vi.mocked(prisma.changelogEntry.findUnique);
const createEntry = vi.mocked(prisma.changelogEntry.create);
const createPost = vi.mocked(prisma.post.create);
const findMetrics = vi.mocked(prisma.geoMetric.findMany);

describe("deriveShipTitle", () => {
  it("keeps short updates intact", () => {
    expect(deriveShipTitle("X sign-in is live.")).toBe("X sign-in is live");
  });

  it("truncates long updates", () => {
    const title = deriveShipTitle("a".repeat(100));
    expect(title.length).toBeLessThanOrEqual(80);
    expect(title.endsWith("...")).toBe(true);
  });
});

describe("shipUpdate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findProject.mockResolvedValue({
      id: "proj_1",
      name: "Xoopa",
      websiteUrl: "https://xoopa.app",
      keywords: ["indie", "saas"],
      userId: "user_1",
    } as never);
    findSlug.mockResolvedValue(null);
    createEntry.mockResolvedValue({
      id: "chg_1",
      slug: "x-sign-in-is-live",
    } as never);
    updateProject.mockResolvedValue({} as never);
    createPost.mockResolvedValue({
      id: "post_1",
      content: "Shipped X sign-in. Try it from the dashboard.",
      mediaUrls: ["https://blob.example/captures/site.png"],
      xPostUrl: null,
    } as never);
    findMetrics.mockResolvedValue([]);
  });

  it("ships post draft, article, media, and geo in one pass", async () => {
    const result = await shipUpdate("user_1", {
      projectId: "proj_1",
      update: "X sign-in is live",
    });

    expect(result.steps.generate.status).toBe("ok");
    expect(result.steps.article.status).toBe("ok");
    expect(result.steps.article.url).toContain("/changelog/x-sign-in-is-live");
    expect(result.steps.media.status).toBe("ok");
    expect(result.steps.post.status).toBe("ok");
    expect(result.steps.post.mediaUrls).toEqual([
      "https://blob.example/captures/site.png",
    ]);
    expect(result.steps.geo.status).toBe("ok");
    expect(result.steps.geo.citationScore).toBe(33);
    expect(createPost).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          mediaUrls: ["https://blob.example/captures/site.png"],
          status: "DRAFT",
        }),
      })
    );
  });

  it("skips media when the project has no website", async () => {
    findProject.mockResolvedValue({
      id: "proj_1",
      name: "Xoopa",
      websiteUrl: null,
      keywords: [],
      userId: "user_1",
    } as never);
    createPost.mockResolvedValue({
      id: "post_1",
      content: "Shipped X sign-in. Try it from the dashboard.",
      mediaUrls: [],
      xPostUrl: null,
    } as never);

    const result = await shipUpdate("user_1", {
      projectId: "proj_1",
      update: "X sign-in is live",
    });

    expect(result.steps.media.status).toBe("skipped");
    expect(result.steps.post.status).toBe("ok");
    expect(createPost).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ mediaUrls: [] }),
      })
    );
  });
});
