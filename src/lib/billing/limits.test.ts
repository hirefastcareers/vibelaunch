import { beforeEach, describe, expect, it, vi } from "vitest";
import { PLAN_LIMITS } from "@/lib/billing/plans";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    project: { count: vi.fn() },
    post: { count: vi.fn() },
    trackedQuery: { count: vi.fn() },
    competitorBrand: { count: vi.fn() },
    contentSuggestion: { count: vi.fn(), aggregate: vi.fn() },
    citationGapAnalysis: { aggregate: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  UsageLimitError,
  assertCanCreateCompetitors,
  assertCanCreatePost,
  assertCanCreateProject,
  assertCanCreateTrackedQueries,
  assertCanRegenerateSuggestion,
  gateSuggestionGeneration,
  getUsage,
} from "@/lib/billing/limits";

const mockedPrisma = prisma as unknown as {
  user: { findUnique: ReturnType<typeof vi.fn> };
  project: { count: ReturnType<typeof vi.fn> };
  post: { count: ReturnType<typeof vi.fn> };
  trackedQuery: { count: ReturnType<typeof vi.fn> };
  competitorBrand: { count: ReturnType<typeof vi.fn> };
  contentSuggestion: {
    count: ReturnType<typeof vi.fn>;
    aggregate: ReturnType<typeof vi.fn>;
  };
  citationGapAnalysis: {
    aggregate: ReturnType<typeof vi.fn>;
  };
};

describe("billing limits (Phase 7)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedPrisma.user.findUnique.mockResolvedValue({ planTier: "FREE" });
    mockedPrisma.project.count.mockResolvedValue(0);
    mockedPrisma.post.count.mockResolvedValue(0);
    mockedPrisma.trackedQuery.count.mockResolvedValue(0);
    mockedPrisma.competitorBrand.count.mockResolvedValue(0);
    mockedPrisma.contentSuggestion.count.mockResolvedValue(0);
    mockedPrisma.contentSuggestion.aggregate.mockResolvedValue({
      _sum: { regenerationCount: 0 },
    });
    mockedPrisma.citationGapAnalysis.aggregate.mockResolvedValue({
      _sum: { generationCount: 0 },
    });
  });

  it("exposes Phase 7 commercial caps", () => {
    expect(PLAN_LIMITS.FREE.trackedQueries).toBe(5);
    expect(PLAN_LIMITS.STARTER.trackedQueries).toBe(15);
    expect(PLAN_LIMITS.PRO.trackedQueries).toBe(25);
    expect(PLAN_LIMITS.FREE.competitors).toBe(1);
    expect(PLAN_LIMITS.STARTER.competitors).toBe(3);
    expect(PLAN_LIMITS.PRO.competitors).toBe(10);
    expect(PLAN_LIMITS.FREE.suggestionGenerationsPerMonth).toBe(5);
    expect(PLAN_LIMITS.STARTER.suggestionGenerationsPerMonth).toBe(20);
    expect(PLAN_LIMITS.PRO.suggestionGenerationsPerMonth).toBe(75);
    expect(PLAN_LIMITS.PRO.suggestionSoftCap).toBe(true);
    expect(PLAN_LIMITS.FREE.citationModels).toEqual([
      "openai",
      "perplexity",
      "gemini",
    ]);
    expect(PLAN_LIMITS.FREE.runsPerWeek).toBe(1);
    expect(PLAN_LIMITS.PRO.runsPerWeek).toBe(2);
  });

  it("getUsage returns FREE Phase 7 limits", async () => {
    mockedPrisma.project.count.mockResolvedValue(1);
    mockedPrisma.post.count.mockResolvedValue(3);
    mockedPrisma.trackedQuery.count.mockResolvedValue(4);
    mockedPrisma.competitorBrand.count.mockResolvedValue(1);
    mockedPrisma.contentSuggestion.count.mockResolvedValue(2);
    mockedPrisma.contentSuggestion.aggregate.mockResolvedValue({
      _sum: { regenerationCount: 1 },
    });

    const usage = await getUsage("user-1");
    expect(usage).toMatchObject({
      planTier: "FREE",
      trackedQueryCount: 4,
      trackedQueryLimit: 5,
      competitorCount: 1,
      competitorLimit: 1,
      suggestionGenerationCount: 3,
      suggestionGenerationsPerMonth: 5,
      suggestionSoftCap: false,
      runsPerWeek: 1,
    });
    expect(usage.citationModels).toEqual(["openai", "perplexity", "gemini"]);
  });

  it("assertCanCreateTrackedQueries enforces Free cap of 5", async () => {
    mockedPrisma.trackedQuery.count.mockResolvedValue(5);
    await expect(
      assertCanCreateTrackedQueries("user-1", 1)
    ).rejects.toMatchObject({ code: "TRACKED_QUERY_LIMIT" });
  });

  it("assertCanCreateCompetitors enforces Free cap of 1", async () => {
    mockedPrisma.competitorBrand.count.mockResolvedValue(1);
    await expect(
      assertCanCreateCompetitors("user-1", 1)
    ).rejects.toMatchObject({ code: "COMPETITOR_LIMIT" });
  });

  it("gateSuggestionGeneration hard-blocks Free at 5/month", async () => {
    mockedPrisma.contentSuggestion.count.mockResolvedValue(5);
    mockedPrisma.contentSuggestion.aggregate.mockResolvedValue({
      _sum: { regenerationCount: 0 },
    });
    await expect(gateSuggestionGeneration("user-1")).rejects.toMatchObject({
      code: "SUGGESTION_LIMIT",
      upgradePath: "/dashboard/billing",
    });
  });

  it("gateSuggestionGeneration soft-warns Pro over 75/month", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({ planTier: "PRO" });
    mockedPrisma.contentSuggestion.count.mockResolvedValue(70);
    mockedPrisma.contentSuggestion.aggregate.mockResolvedValue({
      _sum: { regenerationCount: 10 },
    });
    const gate = await gateSuggestionGeneration("user-1");
    expect(gate.softWarned).toBe(true);
    expect(gate.blocked).toBe(false);
  });

  it("assertCanRegenerateSuggestion uses monthly window", async () => {
    mockedPrisma.contentSuggestion.count.mockResolvedValue(0);
    mockedPrisma.contentSuggestion.aggregate.mockResolvedValue({
      _sum: { regenerationCount: 0 },
    });
    const meta = await assertCanRegenerateSuggestion("user-1", {
      regenerationCount: 2,
      regenerationWindowStart: new Date(
        Date.UTC(
          new Date().getUTCFullYear(),
          new Date().getUTCMonth(),
          1
        )
      ),
    });
    expect(meta.count).toBe(2);
    expect(meta.softWarned).toBe(false);
  });

  it("assertCanCreateProject still enforces workspace caps", async () => {
    mockedPrisma.project.count.mockResolvedValue(1);
    await expect(assertCanCreateProject("user-1")).rejects.toBeInstanceOf(
      UsageLimitError
    );
  });

  it("assertCanCreatePost still enforces monthly post caps", async () => {
    mockedPrisma.post.count.mockResolvedValue(8);
    await expect(assertCanCreatePost("user-1")).rejects.toMatchObject({
      code: "POST_LIMIT",
    });
  });
});
