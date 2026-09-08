import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth/next", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
  cookies: vi.fn(async () => ({
    get: vi.fn(() => undefined),
  })),
}));

vi.mock("./auth", () => ({
  authOptions: {},
}));

vi.mock("./env", () => ({
  applyRequestAuthUrl: vi.fn(),
}));

vi.mock("./prisma", () => ({
  prisma: {
    session: {
      findUnique: vi.fn(),
    },
  },
}));

import { getServerSession } from "next-auth/next";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { getSession, requireAuth } from "./session";

describe("getSession", () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockReset();
    vi.mocked(prisma.session.findUnique).mockReset();
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn(() => undefined),
    } as never);
  });

  it("returns null when NextAuth throws and no session cookie exists", async () => {
    vi.mocked(getServerSession).mockRejectedValue(new Error("db down"));
    await expect(getSession()).resolves.toBeNull();
  });

  it("returns the session when NextAuth succeeds", async () => {
    const session = { user: { id: "u1" } };
    vi.mocked(getServerSession).mockResolvedValue(session as never);
    await expect(getSession()).resolves.toEqual(session);
  });

  it("reads the database session from the cookie when NextAuth returns null", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn((name: string) =>
        name === "next-auth.session-token" ? { value: "tok_1" } : undefined,
      ),
    } as never);
    vi.mocked(prisma.session.findUnique).mockResolvedValue({
      sessionToken: "tok_1",
      expires: new Date(Date.now() + 60_000),
      user: {
        id: "u1",
        name: "Ada",
        email: null,
        image: null,
        xUsername: "ada",
      },
    } as never);

    await expect(getSession()).resolves.toMatchObject({
      user: { id: "u1", xUsername: "ada" },
    });
  });
});

describe("requireAuth", () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockReset();
    vi.mocked(prisma.session.findUnique).mockReset();
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn(() => undefined),
    } as never);
  });

  it("throws when the session lookup fails", async () => {
    vi.mocked(getServerSession).mockRejectedValue(new Error("db down"));
    await expect(requireAuth()).rejects.toThrow("Unauthorized");
  });
});
