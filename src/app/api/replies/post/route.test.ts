import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/session", () => ({
  getSession: vi.fn(async () => ({ user: { id: "user-1" } })),
}));

vi.mock("@/lib/x/publish", () => ({
  publishToX: vi.fn(),
  XApiError: class XApiError extends Error {
    constructor(message: string, public status: number) {
      super(message);
      this.name = "XApiError";
    }
  },
}));

vi.mock("@/lib/x/token", () => ({
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

import { publishToX } from "@/lib/x/publish";

function post(body: unknown) {
  return new NextRequest("http://localhost/api/replies/post", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/replies/post", () => {
  beforeEach(() => {
    vi.mocked(publishToX).mockReset();
  });

  it("posts a reply in-thread", async () => {
    vi.mocked(publishToX).mockResolvedValue({
      id: "88",
      url: "https://x.com/xoopa/status/88",
    });

    const { POST } = await import("./route");
    const res = await POST(post({ tweetId: "11", reply: "Thanks for this." }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.posted).toBe(true);
    expect(data.url).toContain("/status/88");
    expect(publishToX).toHaveBeenCalledWith("user-1", "Thanks for this.", {
      inReplyToTweetId: "11",
    });
  });
});
