import { describe, expect, it } from "vitest";

describe("GET /api/replies/feed", () => {
  it("returns an empty unconfigured feed", async () => {
    const { GET } = await import("./route");
    const data = await (await GET()).json();

    expect(data.configured).toBe(false);
    expect(data.feeds).toEqual({});
  });
});
