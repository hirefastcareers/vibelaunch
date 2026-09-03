import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { UsageLimitError } from "@/lib/billing/limits";

vi.mock("@/lib/session", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/billing/limits", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/billing/limits")>();
  return {
    ...actual,
    assertCanCreateProject: vi.fn(),
    assertCanCreatePost: vi.fn(),
  };
});

vi.mock("@/lib/prisma", () => ({
  prisma: {
    project: { findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
    post: { create: vi.fn(), findMany: vi.fn() },
  },
}));

vi.mock("@/lib/scraper/url-scraper", () => ({
  scrapeUrl: vi.fn(),
}));

vi.mock("@/lib/media/engine", () => ({
  validateMediaUrls: vi.fn(() => ({ valid: true, errors: [] })),
}));

vi.mock("@/lib/queue/qstash", () => ({
  enqueuePost: vi.fn(),
}));

import { getSession } from "@/lib/session";
import { assertCanCreatePost, assertCanCreateProject } from "@/lib/billing/limits";
import { prisma } from "@/lib/prisma";

describe("usage cap API responses", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSession).mockResolvedValue({
      user: { id: "user-1", email: "a@b.c" },
    } as Awaited<ReturnType<typeof getSession>>);
  });

  it("onboard returns 403 with PROJECT_LIMIT code", async () => {
    vi.mocked(assertCanCreateProject).mockRejectedValue(
      new UsageLimitError("Project limit reached for the FREE plan", "PROJECT_LIMIT"),
    );

    const { POST } = await import("@/app/api/project/onboard/route");
    const res = await POST(
      new NextRequest("http://localhost/api/project/onboard", {
        method: "POST",
        body: JSON.stringify({
          targetUrl: "https://sorano.app",
          projectName: "Sorano",
          tone: "build-in-public",
        }),
      }),
    );

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({
      error: "Project limit reached for the FREE plan",
      code: "PROJECT_LIMIT",
    });
  });

  it("posts create returns 403 with POST_LIMIT code", async () => {
    vi.mocked(prisma.project.findFirst).mockResolvedValue({
      id: "proj-1",
      userId: "user-1",
    } as never);
    vi.mocked(assertCanCreatePost).mockRejectedValue(
      new UsageLimitError("Post limit reached for the FREE plan this month", "POST_LIMIT"),
    );

    const { POST } = await import("@/app/api/projects/[id]/posts/route");
    const res = await POST(
      new NextRequest("http://localhost/api/projects/proj-1/posts", {
        method: "POST",
        body: JSON.stringify({ content: "hello world" }),
      }),
      { params: Promise.resolve({ id: "proj-1" }) },
    );

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({
      error: "Post limit reached for the FREE plan this month",
      code: "POST_LIMIT",
    });
    expect(prisma.post.create).not.toHaveBeenCalled();
  });
});
