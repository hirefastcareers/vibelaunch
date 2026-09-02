import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Account } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getValidAccessToken, XAuthError } from "./token";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    account: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

const findFirst = vi.mocked(prisma.account.findFirst);
const update = vi.mocked(prisma.account.update);

function twitterAccount(overrides: Partial<Account> = {}): Account {
  return {
    id: "acc_1",
    userId: "user_1",
    type: "oauth",
    provider: "twitter",
    providerAccountId: "x-user",
    refresh_token: "refresh-old",
    access_token: "access-old",
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: "bearer",
    scope: null,
    id_token: null,
    session_state: null,
    ...overrides,
  };
}

describe("getValidAccessToken", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    findFirst.mockReset();
    update.mockReset();
    process.env.X_CLIENT_ID = "client-id";
    process.env.X_CLIENT_SECRET = "client-secret";
  });

  it("throws NO_ACCOUNT when no twitter account exists", async () => {
    findFirst.mockResolvedValue(null);
    await expect(getValidAccessToken("user_1")).rejects.toMatchObject({
      name: "XAuthError",
      code: "NO_ACCOUNT",
    });
  });

  it("returns the current token when it is not near expiry", async () => {
    findFirst.mockResolvedValue(twitterAccount());
    await expect(getValidAccessToken("user_1")).resolves.toBe("access-old");
    expect(update).not.toHaveBeenCalled();
  });

  it("throws REAUTH_REQUIRED when expired with no refresh_token", async () => {
    findFirst.mockResolvedValue(
      twitterAccount({
        refresh_token: null,
        expires_at: Math.floor(Date.now() / 1000) - 10,
      })
    );
    await expect(getValidAccessToken("user_1")).rejects.toBeInstanceOf(XAuthError);
    await expect(getValidAccessToken("user_1")).rejects.toMatchObject({
      code: "REAUTH_REQUIRED",
    });
  });

  it("refreshes, stores the rotated refresh token, and returns the new access token", async () => {
    findFirst.mockResolvedValue(
      twitterAccount({ expires_at: Math.floor(Date.now() / 1000) + 60 })
    );
    update.mockResolvedValue(twitterAccount());

    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          access_token: "access-new",
          refresh_token: "refresh-new",
          expires_in: 7200,
        }),
        { status: 200 }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(getValidAccessToken("user_1")).resolves.toBe("access-new");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.twitter.com/2/oauth2/token",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: `Basic ${Buffer.from("client-id:client-secret").toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        }),
      })
    );

    expect(update).toHaveBeenCalledWith({
      where: { id: "acc_1" },
      data: {
        access_token: "access-new",
        refresh_token: "refresh-new",
        expires_at: expect.any(Number),
      },
    });
  });

  it("throws REAUTH_REQUIRED on a non-2xx refresh response", async () => {
    findFirst.mockResolvedValue(
      twitterAccount({ expires_at: Math.floor(Date.now() / 1000) - 1 })
    );
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("invalid_grant", { status: 400 }))
    );

    await expect(getValidAccessToken("user_1")).rejects.toMatchObject({
      code: "REAUTH_REQUIRED",
      message: expect.stringContaining("400"),
    });
    expect(update).not.toHaveBeenCalled();
  });
});
