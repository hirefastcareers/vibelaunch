import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("./auth", () => ({
  authOptions: {},
}));

import { getServerSession } from "next-auth";
import { getSession, requireAuth } from "./session";

describe("getSession", () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockReset();
  });

  it("returns null when NextAuth throws instead of crashing the page", async () => {
    vi.mocked(getServerSession).mockRejectedValue(new Error("db down"));
    await expect(getSession()).resolves.toBeNull();
  });

  it("returns the session when NextAuth succeeds", async () => {
    const session = { user: { id: "u1" } };
    vi.mocked(getServerSession).mockResolvedValue(session as never);
    await expect(getSession()).resolves.toEqual(session);
  });
});

describe("requireAuth", () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockReset();
  });

  it("throws when the session lookup fails", async () => {
    vi.mocked(getServerSession).mockRejectedValue(new Error("db down"));
    await expect(requireAuth()).rejects.toThrow("Unauthorized");
  });
});
