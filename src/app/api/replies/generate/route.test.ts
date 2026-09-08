import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/session", () => ({
  getSession: vi.fn(async () => ({ user: { id: "user-1" } })),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    project: { findFirst: vi.fn() },
  },
}));

vi.mock("@/lib/replies/generate-reply", () => ({
  generateSmartReply: vi.fn(async () => "Warm helpful reply under 280."),
}));

import { prisma } from "@/lib/prisma";
import { generateSmartReply } from "@/lib/replies/generate-reply";

const findFirst = vi.mocked(prisma.project.findFirst);
const generate = vi.mocked(generateSmartReply);

function post(body: unknown) {
  return new NextRequest("http://localhost/api/replies/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/replies/generate", () => {
  beforeEach(() => {
    vi.resetModules();
    findFirst.mockReset();
    generate.mockClear();
    findFirst.mockResolvedValue({
      name: "Xoopa",
      tagline: "Autonomous growth",
      description: "For indie founders",
      tone: "casual",
    } as never);
  });

  it("returns a drafted reply with project context", async () => {
    const { POST } = await import("./route");
    const res = await POST(
      post({ originalPost: "Just hit $1k MRR", keyword: "#buildinpublic" })
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.configured).toBe(true);
    expect(data.reply).toMatch(/Warm helpful/);
    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({
        originalPost: "Just hit $1k MRR",
        keyword: "#buildinpublic",
        projectName: "Xoopa",
      })
    );
  });
});
