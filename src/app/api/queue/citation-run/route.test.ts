import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/queue/qstash", () => ({
  verifyQStashSignature: vi.fn(async () => false),
}));

vi.mock("@/lib/geo/citation-runner", () => ({
  executeCitationSweepForQuery: vi.fn(async () => []),
}));

function request(body = "{}", signature = "bad") {
  return new NextRequest("http://localhost/api/queue/citation-run", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "upstash-signature": signature,
    },
    body,
  });
}

describe("/api/queue/citation-run", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Fail-closed must not depend on NODE_ENV.
    process.env.NODE_ENV = "development";
  });

  it("rejects invalid QStash signatures in non-production", async () => {
    const { POST } = await import("./route");
    const { verifyQStashSignature } = await import("@/lib/queue/qstash");
    vi.mocked(verifyQStashSignature).mockResolvedValue(false);

    const res = await POST(request());
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Invalid signature" });
  });

  it("rejects invalid QStash signatures in production", async () => {
    process.env.NODE_ENV = "production";
    const { POST } = await import("./route");
    const { verifyQStashSignature } = await import("@/lib/queue/qstash");
    vi.mocked(verifyQStashSignature).mockResolvedValue(false);

    const res = await POST(request());
    expect(res.status).toBe(401);
  });
});
