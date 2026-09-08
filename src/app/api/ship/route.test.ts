import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/session", () => ({
  getSession: vi.fn(async () => ({ user: { id: "user-1" } })),
}));

vi.mock("@/lib/ship/ship-update", () => {
  class ShipError extends Error {
    constructor(
      message: string,
      public status: number,
      public code?: string
    ) {
      super(message);
      this.name = "ShipError";
    }
  }
  return {
    ShipError,
    shipUpdate: vi.fn(async () => ({
      projectId: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
      projectName: "Xoopa",
      update: "Shipped replies",
      steps: {
        generate: { status: "ok", content: "Replies are live." },
        article: { status: "ok", url: "https://xoopa.app/changelog/replies" },
        media: { status: "ok", url: "https://blob.example/a.png" },
        post: { status: "ok", id: "post_1" },
        geo: { status: "ok", citationScore: 20 },
      },
    })),
  };
});

import { getSession } from "@/lib/session";
import { shipUpdate } from "@/lib/ship/ship-update";

const session = vi.mocked(getSession);
const ship = vi.mocked(shipUpdate);

// zod cuid: starts with c, then lowercase alphanumeric, length typically 25
const PROJECT_ID = "clh3z4k0q0000qzrmn7b9vq7s";

function post(body: unknown) {
  return new NextRequest("http://localhost/api/ship", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/ship", () => {
  beforeEach(() => {
    session.mockResolvedValue({ user: { id: "user-1" } } as never);
    ship.mockClear();
  });

  it("returns 401 when signed out", async () => {
    session.mockResolvedValue(null);
    const { POST } = await import("./route");
    const res = await POST(post({ projectId: PROJECT_ID, update: "hi" }));
    expect(res.status).toBe(401);
  });

  it("ships an update for the signed-in user", async () => {
    const { POST } = await import("./route");
    const res = await POST(
      post({
        projectId: PROJECT_ID,
        update: "Shipped replies",
        tone: "casual",
      })
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.steps.post.status).toBe("ok");
    expect(ship).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({
        projectId: PROJECT_ID,
        update: "Shipped replies",
      })
    );
  });

  it("rejects invalid payloads", async () => {
    const { POST } = await import("./route");
    const res = await POST(post({ projectId: "nope", update: "" }));
    expect(res.status).toBe(400);
  });
});
