import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { isDemoMode } from "@/lib/demo-mode";
import { MOCK_AI_REPLY, MOCK_SMART_REPLIES_FEED } from "@/lib/mock-data";

vi.mock("@/lib/demo-mode", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-mode")>();
  return {
    ...actual,
    isDemoMode: vi.fn(),
    demoDelay: vi.fn(async () => {}),
  };
});

vi.mock("@/lib/session", () => ({
  getSession: vi.fn(async () => ({ user: { id: "demo-user-id" } })),
}));

function post(body: unknown) {
  return new NextRequest("http://localhost/api/replies/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/replies/generate", () => {
  beforeEach(() => {
    vi.mocked(isDemoMode).mockReset();
  });

  it("returns a mock reply in demo mode", async () => {
    vi.mocked(isDemoMode).mockReturnValue(true);
    const { POST } = await import("./route");
    const item = MOCK_SMART_REPLIES_FEED["#buildinpublic"][0];
    const res = await POST(
      post({ originalPost: item.content, keyword: "#buildinpublic" })
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.configured).toBe(true);
    expect(data.reply).toBe(item.suggestedReply);
  });

  it("returns a fallback mock when the post is not in the demo feed", async () => {
    vi.mocked(isDemoMode).mockReturnValue(true);
    const { POST } = await import("./route");
    const res = await POST(post({ originalPost: "unrelated post" }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.reply).toBe(MOCK_AI_REPLY);
  });

  it("does not fabricate a reply outside demo mode", async () => {
    vi.mocked(isDemoMode).mockReturnValue(false);
    const { POST } = await import("./route");
    const res = await POST(post({ originalPost: "any post", keyword: "#buildinpublic" }));
    const data = await res.json();

    expect(res.status).toBe(503);
    expect(data.configured).toBe(false);
    expect(data.reply).toBeUndefined();
    expect(data.error).toMatch(/aren't connected/i);
  });
});
