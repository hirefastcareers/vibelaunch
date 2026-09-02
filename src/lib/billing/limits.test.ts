import { beforeEach, describe, expect, it, vi } from "vitest";
import { PLAN_LIMITS } from "@/lib/billing/plans";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    project: { count: vi.fn() },
    post: { count: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  UsageLimitError,
  assertCanCreatePost,
  assertCanCreateProject,
  getUsage,
} from "@/lib/billing/limits";

const mockedPrisma = prisma as unknown as {
  user: { findUnique: ReturnType<typeof vi.fn> };
  project: { count: ReturnType<typeof vi.fn> };
  post: { count: ReturnType<typeof vi.fn> };
};

describe("billing limits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedPrisma.user.findUnique.mockResolvedValue({ planTier: "FREE" });
    mockedPrisma.project.count.mockResolvedValue(0);
    mockedPrisma.post.count.mockResolvedValue(0);
  });

  it("getUsage returns counts and FREE limits", async () => {
    mockedPrisma.project.count.mockResolvedValue(1);
    mockedPrisma.post.count.mockResolvedValue(3);

    const usage = await getUsage("user-1");
    expect(usage).toEqual({
      planTier: "FREE",
      projectCount: 1,
      postCount: 3,
      projectLimit: PLAN_LIMITS.FREE.projects,
      postLimit: PLAN_LIMITS.FREE.postsPerMonth,
    });
    expect(mockedPrisma.post.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: { not: "DRAFT" },
          project: { userId: "user-1" },
        }),
      }),
    );
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
    await expect(assertCanCreatePost("user-1")).rejects.toBeInstanceOf(UsageLimitError);
    await expect(assertCanCreatePost("user-1")).rejects.toMatchObject({
      code: "POST_LIMIT",
    });
  });

  it("defaults a missing user to FREE", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null);
    mockedPrisma.project.count.mockResolvedValue(1);
    await expect(assertCanCreateProject("missing")).rejects.toMatchObject({
      code: "PROJECT_LIMIT",
    });
  });
});
