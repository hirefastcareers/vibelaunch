import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/diagnostics/agent", () => ({
  runDiagnosticsForAllProjects: vi.fn(async () => ({ projects: 0 })),
}));

function request(auth?: string, method = "GET") {
  const headers = new Headers();
  if (auth) headers.set("authorization", auth);
  return new NextRequest("http://localhost/api/cron/diagnostics", { method, headers });
}

describe("/api/cron/diagnostics", () => {
  beforeEach(() => {
    process.env.CRON_SECRET = "test-cron-secret";
  });

  it("rejects GET without Authorization", async () => {
    const { GET } = await import("./route");
    const res = await GET(request());

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("rejects POST without Authorization", async () => {
    const { POST } = await import("./route");
    const res = await POST(request(undefined, "POST"));

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
  });
});
