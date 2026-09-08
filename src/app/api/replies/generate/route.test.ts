import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/session", () => ({
  getSession: vi.fn(async () => ({ user: { id: "user-1" } })),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    project: {
      findFirst: vi.fn(async () => ({
        name: "Xoopa",
        tagline: "Ship and grow",
        description: "Growth loop",
        tone: "casual",
      })),
    },
  },
}));

vi.mock("@/lib/generator/reply", () => ({
  generateSmartReply: vi.fn(async () => "Helpful reply about shipping."),
}));

import { generateSmartReply } from "@/lib/generator/reply";

function post(body: unknown) {
  return new NextRequest("http://localhost/api/replies/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/replies/generate", () => {
  beforeEach(() => {
    vi.mocked(generateSmartReply).mockClear();
  });

  it("returns a generated reply with project context", async () => {
    const { POST } = await import("./route");
    const res = await POST(
      post({ originalPost: "Just shipped", keyword: "@mentions" })
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.configured).toBe(true);
    expect(data.reply).toBe("Helpful reply about shipping.");
    expect(generateSmartReply).toHaveBeenCalledWith(
      "Just shipped",
      expect.objectContaining({
        keyword: "@mentions",
        project: expect.objectContaining({ name: "Xoopa" }),
      })
    );
  });
});
