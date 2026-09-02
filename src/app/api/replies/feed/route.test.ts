import { beforeEach, describe, expect, it, vi } from "vitest";
import { MOCK_SMART_REPLIES_FEED } from "@/lib/mock-data";
import { isDemoMode } from "@/lib/demo-mode";

vi.mock("@/lib/demo-mode", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-mode")>();
  return {
    ...actual,
    isDemoMode: vi.fn(),
    demoDelay: vi.fn(async () => {}),
  };
});

describe("GET /api/replies/feed", () => {
  beforeEach(() => {
    vi.mocked(isDemoMode).mockReset();
  });

  it("returns the mock feed only in demo mode", async () => {
    vi.mocked(isDemoMode).mockReturnValue(true);
    const { GET } = await import("./route");
    const data = await (await GET()).json();

    expect(data.configured).toBe(true);
    expect(data.feeds).toEqual(MOCK_SMART_REPLIES_FEED);
  });

  it("returns an empty unconfigured feed outside demo mode", async () => {
    vi.mocked(isDemoMode).mockReturnValue(false);
    const { GET } = await import("./route");
    const data = await (await GET()).json();

    expect(data.configured).toBe(false);
    expect(data.feeds).toEqual({});
  });
});
