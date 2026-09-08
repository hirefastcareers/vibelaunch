import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    project: { findFirst: vi.fn() },
  },
}));

vi.mock("@/lib/x/token", () => ({
  getValidAccessToken: vi.fn(),
  XAuthError: class XAuthError extends Error {
    constructor(
      message: string,
      public code: "NO_ACCOUNT" | "REFRESH_FAILED" | "REAUTH_REQUIRED"
    ) {
      super(message);
      this.name = "XAuthError";
    }
  },
}));

import { prisma } from "@/lib/prisma";
import { getValidAccessToken, XAuthError } from "@/lib/x/token";
import {
  buildRepliesFeed,
  getXBearerToken,
  searchRecentByKeyword,
} from "./replies";

const findUser = vi.mocked(prisma.user.findUnique);
const findProject = vi.mocked(prisma.project.findFirst);
const token = vi.mocked(getValidAccessToken);

describe("getXBearerToken", () => {
  it("prefers X_BEARER_TOKEN over X_API_KEY", () => {
    const prevBearer = process.env.X_BEARER_TOKEN;
    const prevKey = process.env.X_API_KEY;
    process.env.X_BEARER_TOKEN = "bearer";
    process.env.X_API_KEY = "key";
    expect(getXBearerToken()).toBe("bearer");
    process.env.X_BEARER_TOKEN = prevBearer;
    process.env.X_API_KEY = prevKey;
  });
});

describe("searchRecentByKeyword", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("maps search results into feed items", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      Response.json({
        data: [
          {
            id: "99",
            text: "Looking for a micro-saas tool",
            author_id: "u1",
            created_at: "2026-09-08T12:00:00.000Z",
          },
        ],
        includes: { users: [{ id: "u1", username: "founder" }] },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const items = await searchRecentByKeyword("micro-saas", {
      bearerToken: "bearer",
      excludeUsername: "xoopa",
    });

    expect(items).toEqual([
      {
        id: "99",
        author: "@founder",
        content: "Looking for a micro-saas tool",
        url: "https://x.com/founder/status/99",
        createdAt: "2026-09-08T12:00:00.000Z",
      },
    ]);

    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain("tweets/search/recent");
    expect(decodeURIComponent(url)).toContain("-from:xoopa");
  });
});

describe("buildRepliesFeed", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    findUser.mockReset();
    findProject.mockReset();
    token.mockReset();
    delete process.env.X_BEARER_TOKEN;
    delete process.env.X_API_KEY;
  });

  it("returns unconfigured when X is not connected", async () => {
    findProject.mockResolvedValue({
      id: "p1",
      name: "Xoopa",
      keywords: ["indie saas"],
    } as never);
    token.mockRejectedValue(new XAuthError("missing", "NO_ACCOUNT"));

    const result = await buildRepliesFeed("user_1");

    expect(result.configured).toBe(false);
    expect(result.feeds).toEqual({});
    expect(result.warning).toMatch(/Connect X/i);
  });

  it("loads mentions into the @mentions feed", async () => {
    findProject.mockResolvedValue({
      id: "p1",
      name: "Xoopa",
      keywords: [],
    } as never);
    findUser.mockResolvedValue({
      xUserId: "42",
      xUsername: "xoopa",
    } as never);
    token.mockResolvedValue("access");

    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(async () =>
        Response.json({
          data: [
            {
              id: "1",
              text: "Love @xoopa",
              author_id: "7",
              created_at: "2026-09-08T10:00:00.000Z",
            },
          ],
          includes: { users: [{ id: "7", username: "fan" }] },
        })
      )
    );

    const result = await buildRepliesFeed("user_1");

    expect(result.configured).toBe(true);
    expect(result.sources.mentions).toBe(true);
    expect(result.feeds["@mentions"]?.[0]).toMatchObject({
      id: "1",
      author: "@fan",
      content: "Love @xoopa",
    });
  });
});
