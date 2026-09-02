import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { isDemoMode } from "@/lib/demo-mode";

vi.mock("@/lib/demo-mode", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-mode")>();
  return {
    ...actual,
    isDemoMode: vi.fn(),
    demoDelay: vi.fn(async () => {}),
  };
});

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
    vi.mocked(isDemoMode).mockReset();
    process.env.CRON_SECRET = "test-cron-secret";
  });

  it("rejects GET without Authorization outside demo mode", async () => {
    vi.mocked(isDemoMode).mockReturnValue(false);
    const { GET } = await import("./route");
    const res = await GET(request());

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("rejects POST without Authorization outside demo mode", async () => {
    vi.mocked(isDemoMode).mockReturnValue(false);
    const { POST } = await import("./route");
    const res = await POST(request(undefined, "POST"));

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
  });
});
