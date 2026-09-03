import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/session", () => ({
  getSession: vi.fn(async () => ({ user: { id: "user-1" } })),
}));

function post(body: unknown) {
  return new NextRequest("http://localhost/api/replies/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/replies/generate", () => {
  it("does not fabricate a reply before the live feed is wired", async () => {
    const { POST } = await import("./route");
    const res = await POST(post({ originalPost: "any post", keyword: "#buildinpublic" }));
    const data = await res.json();

    expect(res.status).toBe(503);
    expect(data.configured).toBe(false);
    expect(data.reply).toBeUndefined();
    expect(data.error).toMatch(/aren't connected/i);
  });
});
