import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/session", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    project: { findMany: vi.fn() },
    account: { findFirst: vi.fn() },
  },
}));

vi.mock("@/lib/x/search", () => ({
  getAppSearchBearer: vi.fn(() => null),
  isRepliesSearchConfigured: vi.fn(),
  searchRecentByKeyword: vi.fn(),
  fetchUserMentions: vi.fn(),
}));

import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  fetchUserMentions,
  isRepliesSearchConfigured,
  searchRecentByKeyword,
} from "@/lib/x/search";

const session = vi.mocked(getSession);
const findUser = vi.mocked(prisma.user.findUnique);
const findProjects = vi.mocked(prisma.project.findMany);
const findAccount = vi.mocked(prisma.account.findFirst);
const configured = vi.mocked(isRepliesSearchConfigured);
const search = vi.mocked(searchRecentByKeyword);
const mentions = vi.mocked(fetchUserMentions);

describe("GET /api/replies/feed", () => {
  beforeEach(() => {
    vi.resetModules();
    session.mockReset();
    findUser.mockReset();
    findProjects.mockReset();
    findAccount.mockReset();
    configured.mockReset();
    search.mockReset();
    mentions.mockReset();
  });

  it("returns 401 when signed out", async () => {
    session.mockResolvedValue(null);
    const { GET } = await import("./route");
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns an empty unconfigured feed when X search is unavailable", async () => {
    session.mockResolvedValue({ user: { id: "user-1" } } as never);
    findUser.mockResolvedValue({ xUserId: null, xUsername: null } as never);
    findProjects.mockResolvedValue([]);
    findAccount.mockResolvedValue(null);
    configured.mockReturnValue(false);

    const { GET } = await import("./route");
    const data = await (await GET()).json();

    expect(data.configured).toBe(false);
    expect(data.feeds).toEqual({});
    expect(search).not.toHaveBeenCalled();
  });

  it("groups live keyword results and mentions when configured", async () => {
    session.mockResolvedValue({ user: { id: "user-1" } } as never);
    findUser.mockResolvedValue({ xUserId: "x-1", xUsername: "founder" } as never);
    findProjects.mockResolvedValue([
      { name: "Xoopa", keywords: ["#buildinpublic", "vibecoding"], tagline: "Growth" },
    ] as never);
    findAccount.mockResolvedValue({ access_token: "tok" } as never);
    configured.mockReturnValue(true);
    search
      .mockResolvedValueOnce([
        {
          id: "1",
          author: "@indie",
          content: "Shipping in public",
          url: "https://x.com/indie/status/1",
        },
      ])
      .mockResolvedValueOnce([]);
    mentions.mockResolvedValue([
      {
        id: "9",
        author: "@fan",
        content: "love xoopa",
        url: "https://x.com/fan/status/9",
      },
    ]);

    const { GET } = await import("./route");
    const data = await (await GET()).json();

    expect(data.configured).toBe(true);
    expect(data.keywords).toEqual(["#buildinpublic", "vibecoding"]);
    expect(data.feeds["#buildinpublic"]).toHaveLength(1);
    expect(data.feeds["@mentions"]).toHaveLength(1);
    expect(search).toHaveBeenCalledTimes(2);
    expect(mentions).toHaveBeenCalledWith("user-1", "x-1", 10);
  });
});
