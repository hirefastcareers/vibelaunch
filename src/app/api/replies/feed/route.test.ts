import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/session", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/x/replies", () => ({
  buildRepliesFeed: vi.fn(),
}));

import { getSession } from "@/lib/session";
import { buildRepliesFeed } from "@/lib/x/replies";

describe("GET /api/replies/feed", () => {
  beforeEach(() => {
    vi.mocked(getSession).mockReset();
    vi.mocked(buildRepliesFeed).mockReset();
  });

  it("requires auth", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const { GET } = await import("./route");
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns the live feed for the signed-in user", async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { id: "user-1" },
    } as never);
    vi.mocked(buildRepliesFeed).mockResolvedValue({
      feeds: {
        "@mentions": [
          {
            id: "1",
            author: "@fan",
            content: "Nice work",
            url: "https://x.com/fan/status/1",
          },
        ],
      },
      configured: true,
      sources: { mentions: true, keywords: false },
      project: { id: "p1", name: "Xoopa", keywords: [] },
    });

    const { GET } = await import("./route");
    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.configured).toBe(true);
    expect(data.feeds["@mentions"]).toHaveLength(1);
    expect(buildRepliesFeed).toHaveBeenCalledWith("user-1");
  });
});
