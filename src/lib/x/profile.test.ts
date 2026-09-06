import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { extractXProfile, persistXUserProfile } from "./profile";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      updateMany: vi.fn(),
    },
  },
}));

const updateMany = vi.mocked(prisma.user.updateMany);

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
    updateMany.mockReset();
    updateMany.mockResolvedValue({ count: 0 });
  });

  it("does not throw when the User row does not exist yet", async () => {
    await expect(
      persistXUserProfile("missing-id", { provider: "twitter", providerAccountId: "12" }, {
        data: { id: "12", username: "tom" },
      }),
    ).resolves.toBeUndefined();
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: "missing-id" },
      data: { xUserId: "12", xUsername: "tom" },
    });
  });

  it("skips the write when there is no user id", async () => {
    await persistXUserProfile(undefined, { provider: "twitter", providerAccountId: "12" }, {});
    expect(updateMany).not.toHaveBeenCalled();
  });
});
