import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { getValidAccessToken } from "@/lib/x/token";
import { publishToX } from "./publish";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/x/token", () => ({
  getValidAccessToken: vi.fn(),
  XAuthError: class XAuthError extends Error {
    constructor(
      message: string,
      public code: "NO_ACCOUNT" | "REFRESH_FAILED" | "REAUTH_REQUIRED"
    ) {
      super(message);
      this.name = "XAuthError";
    }
  },
}));

const findUnique = vi.mocked(prisma.user.findUnique);
const token = vi.mocked(getValidAccessToken);

describe("publishToX media upload", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    findUnique.mockReset();
    token.mockReset();
    token.mockResolvedValue("access-token");
    findUnique.mockResolvedValue({ xUsername: "demo" } as never);
  });

  it("throws a 422 XApiError for video/non-image media without calling the upload endpoint", async () => {
    const fetchMock = vi.fn<typeof fetch>(
      async () =>
        new Response(new Uint8Array([1, 2, 3]), {
          status: 200,
          headers: { "content-type": "video/webm" },
        })
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      publishToX("user_1", "clip", ["https://blob.example/clip.webm"])
    ).rejects.toMatchObject({
      name: "XApiError",
      status: 422,
      message:
        "Video/non-image media upload isn't implemented yet — only JPEG/PNG/GIF/WEBP images are supported",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("https://blob.example/clip.webm");
  });

  it("uploads JPEG/PNG/GIF/WEBP images to the v2 simple endpoint as multipart tweet_image", async () => {
    const fetchMock = vi.fn<typeof fetch>(async (input) => {
      const href = String(input);
      if (href === "https://blob.example/card.png") {
        return new Response(new Uint8Array([137, 80, 78, 71]), {
          status: 200,
          headers: { "content-type": "image/png; charset=binary" },
        });
      }
      if (href === "https://api.x.com/2/media/upload") {
        return new Response(JSON.stringify({ data: { id: "media_1", media_key: "3_1" } }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }
      if (href === "https://api.twitter.com/2/tweets") {
        return new Response(JSON.stringify({ data: { id: "tweet_1" } }), {
          status: 201,
          headers: { "content-type": "application/json" },
        });
      }
      return new Response("unexpected", { status: 500 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await publishToX("user_1", "card", ["https://blob.example/card.png"]);
    expect(result.id).toBe("tweet_1");

    const uploadCall = fetchMock.mock.calls.find(
      (call) => String(call[0]) === "https://api.x.com/2/media/upload"
    );
    expect(uploadCall).toBeDefined();
    const uploadInit = uploadCall?.[1];
    expect(uploadInit?.body).toBeInstanceOf(FormData);
    const form = uploadInit?.body as FormData;
    expect(form.get("media_category")).toBe("tweet_image");
    expect(form.get("media_type")).toBe("image/png");
    const media = form.get("media") as Blob;
    expect(media.type).toBe("image/png");
    expect(uploadInit?.headers).toEqual({ Authorization: "Bearer access-token" });

    expect(
      fetchMock.mock.calls.some(
        (call) => String(call[0]) === "https://upload.twitter.com/1.1/media/upload.json"
      )
    ).toBe(false);
  });
});
