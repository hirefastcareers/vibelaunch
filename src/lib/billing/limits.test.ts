import { beforeEach, describe, expect, it, vi } from "vitest";
import { PLAN_LIMITS } from "@/lib/billing/plans";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    project: { count: vi.fn() },
    post: { count: vi.fn() },
    trackedQuery: { count: vi.fn() },
    competitorBrand: { count: vi.fn() },
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
  getUsage,
} from "@/lib/billing/limits";

const mockedPrisma = prisma as unknown as {
  user: { findUnique: ReturnType<typeof vi.fn> };
  project: { count: ReturnType<typeof vi.fn> };
  post: { count: ReturnType<typeof vi.fn> };
  trackedQuery: { count: ReturnType<typeof vi.fn> };
  competitorBrand: { count: ReturnType<typeof vi.fn> };
};

describe("billing limits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedPrisma.user.findUnique.mockResolvedValue({ planTier: "FREE" });
    mockedPrisma.project.count.mockResolvedValue(0);
    mockedPrisma.post.count.mockResolvedValue(0);
    mockedPrisma.trackedQuery.count.mockResolvedValue(0);
    mockedPrisma.competitorBrand.count.mockResolvedValue(0);
  });

  it("getUsage returns counts and FREE limits including competitors", async () => {
    mockedPrisma.project.count.mockResolvedValue(1);
    mockedPrisma.post.count.mockResolvedValue(3);
    mockedPrisma.trackedQuery.count.mockResolvedValue(4);
    mockedPrisma.competitorBrand.count.mockResolvedValue(1);

    const usage = await getUsage("user-1");
    expect(usage).toEqual({
      planTier: "FREE",
      projectCount: 1,
      postCount: 3,
      trackedQueryCount: 4,
      competitorCount: 1,
      projectLimit: PLAN_LIMITS.FREE.projects,
      postLimit: PLAN_LIMITS.FREE.postsPerMonth,
      trackedQueryLimit: PLAN_LIMITS.FREE.trackedQueries,
      competitorLimit: PLAN_LIMITS.FREE.competitors,
      suggestionRegensPerDay: PLAN_LIMITS.FREE.suggestionRegensPerDay,
    });
  });

  it("assertCanCreateProject throws PROJECT_LIMIT at the Free cap", async () => {
    mockedPrisma.project.count.mockResolvedValue(1);
    await expect(assertCanCreateProject("user-1")).rejects.toMatchObject({
      name: "UsageLimitError",
      code: "PROJECT_LIMIT",
    });
  });

  it("assertCanCreateProject allows a first project on Free", async () => {
    mockedPrisma.project.count.mockResolvedValue(0);
    await expect(assertCanCreateProject("user-1")).resolves.toBeUndefined();
  });

  it("assertCanCreatePost throws POST_LIMIT on the 9th non-draft post", async () => {
    mockedPrisma.post.count.mockResolvedValue(8);
    await expect(assertCanCreatePost("user-1")).rejects.toBeInstanceOf(
      UsageLimitError
    );
    await expect(assertCanCreatePost("user-1")).rejects.toMatchObject({
      code: "POST_LIMIT",
    });
  });

  it("assertCanCreateTrackedQueries enforces the Free placeholder cap of 10", async () => {
    mockedPrisma.trackedQuery.count.mockResolvedValue(10);
    await expect(
      assertCanCreateTrackedQueries("user-1", 1)
    ).rejects.toMatchObject({
      code: "TRACKED_QUERY_LIMIT",
    });
  });

  it("assertCanCreateCompetitors enforces the Free placeholder cap of 1", async () => {
    mockedPrisma.competitorBrand.count.mockResolvedValue(1);
    await expect(assertCanCreateCompetitors("user-1", 1)).rejects.toMatchObject(
      {
        code: "COMPETITOR_LIMIT",
      }
    );
  });

  it("assertCanCreateCompetitors allows the first Free competitor", async () => {
    mockedPrisma.competitorBrand.count.mockResolvedValue(0);
    await expect(
      assertCanCreateCompetitors("user-1", 1)
    ).resolves.toBeUndefined();
  });

  it("assertCanRegenerateSuggestion enforces the 3/day placeholder cap", async () => {
    const windowStart = new Date(
      Date.UTC(
        new Date().getUTCFullYear(),
        new Date().getUTCMonth(),
        new Date().getUTCDate()
      )
    );
    await expect(
      assertCanRegenerateSuggestion("user-1", {
        regenerationCount: 3,
        regenerationWindowStart: windowStart,
      })
    ).rejects.toMatchObject({
      code: "SUGGESTION_REGEN_LIMIT",
    });
  });

  it("assertCanRegenerateSuggestion resets when the UTC day window rolls", async () => {
    const yesterday = new Date(
      Date.UTC(
        new Date().getUTCFullYear(),
        new Date().getUTCMonth(),
        new Date().getUTCDate() - 1
      )
    );
    await expect(
      assertCanRegenerateSuggestion("user-1", {
        regenerationCount: 3,
        regenerationWindowStart: yesterday,
      })
    ).resolves.toMatchObject({ count: 0 });
  });

  it("defaults a missing user to FREE", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null);
    mockedPrisma.project.count.mockResolvedValue(1);
    await expect(assertCanCreateProject("missing")).rejects.toMatchObject({
      code: "PROJECT_LIMIT",
    });
  });
});
