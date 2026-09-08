import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { extractXProfile, persistXOauthTokens, persistXUserProfile } from "./profile";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      updateMany: vi.fn(),
    },
    account: {
      updateMany: vi.fn(),
    },
  },
}));

const updateUser = vi.mocked(prisma.user.updateMany);
const updateAccount = vi.mocked(prisma.account.updateMany);

describe("extractXProfile", () => {
  it("reads id and username from the raw X OAuth profile", () => {
    expect(
      extractXProfile(
        { provider: "twitter", providerAccountId: "fallback" },
        { data: { id: "12", username: "tom" } },
      ),
    ).toEqual({ xUserId: "12", xUsername: "tom" });
  });

  it("falls back to providerAccountId when the raw profile has no data", () => {
    expect(
      extractXProfile({ provider: "twitter", providerAccountId: "12" }, { name: "Tom" }),
    ).toEqual({ xUserId: "12", xUsername: undefined });
  });

  it("ignores non-twitter accounts", () => {
    expect(
      extractXProfile(
        { provider: "github", providerAccountId: "12" },
        { data: { id: "12", username: "tom" } },
      ),
    ).toBeNull();
  });
});

describe("persistXUserProfile", () => {
  beforeEach(() => {
    updateUser.mockReset();
    updateUser.mockResolvedValue({ count: 0 });
  });

  it("does not throw when the User row does not exist yet", async () => {
    await expect(
      persistXUserProfile("missing-id", { provider: "twitter", providerAccountId: "12" }, {
        data: { id: "12", username: "tom" },
      }),
    ).resolves.toBeUndefined();
    expect(updateUser).toHaveBeenCalledWith({
      where: { id: "missing-id" },
      data: { xUserId: "12", xUsername: "tom" },
    });
  });

  it("skips the write when there is no user id", async () => {
    await persistXUserProfile(undefined, { provider: "twitter", providerAccountId: "12" }, {});
    expect(updateUser).not.toHaveBeenCalled();
  });
});

describe("persistXOauthTokens", () => {
  beforeEach(() => {
    updateAccount.mockReset();
    updateAccount.mockResolvedValue({ count: 1 });
  });

  it("writes fresh access and refresh tokens on later sign-ins", async () => {
    await persistXOauthTokens("user_1", {
      provider: "twitter",
      access_token: "access-new",
      refresh_token: "refresh-new",
      expires_in: 7200,
      token_type: "bearer",
      scope: "tweet.write",
    });

    expect(updateAccount).toHaveBeenCalledWith({
      where: { userId: "user_1", provider: "twitter" },
      data: {
        access_token: "access-new",
        refresh_token: "refresh-new",
        expires_at: expect.any(Number),
        token_type: "bearer",
        scope: "tweet.write",
      },
    });
    const expiresAt = updateAccount.mock.calls[0][0].data.expires_at as number;
    expect(expiresAt).toBeGreaterThan(1_000_000_000);
  });

  it("skips the write when there is no access token", async () => {
    await persistXOauthTokens("user_1", { provider: "twitter", refresh_token: "x" });
    expect(updateAccount).not.toHaveBeenCalled();
  });
});
