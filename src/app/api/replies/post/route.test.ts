import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/session", () => ({
  getSession: vi.fn(async () => ({ user: { id: "user-1" } })),
}));

vi.mock("@/lib/x/publish", () => ({
  publishReplyToX: vi.fn(async () => ({
    id: "reply-1",
    url: "https://x.com/demo/status/reply-1",
  })),
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

import { publishReplyToX } from "@/lib/x/publish";

const publish = vi.mocked(publishReplyToX);

function post(body: unknown) {
  return new NextRequest("http://localhost/api/replies/post", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/replies/post", () => {
  beforeEach(() => {
    vi.resetModules();
    publish.mockClear();
  });

  it("posts a reply through X", async () => {
    const { POST } = await import("./route");
    const res = await POST(
      post({ content: "Nice work!", inReplyToTweetId: "123" })
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.url).toContain("reply-1");
    expect(publish).toHaveBeenCalledWith("user-1", "Nice work!", "123");
  });
});
