import { beforeEach, describe, expect, it, vi } from "vitest";
import { dispatchPostPublish, hasQStash } from "./dispatch-post";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    post: {
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/queue/qstash", () => ({
  enqueuePost: vi.fn(),
}));

vi.mock("@/lib/x/publish", () => ({
  publishToX: vi.fn(),
  XApiError: class XApiError extends Error {},
  XAuthError: class XAuthError extends Error {},
}));

vi.mock("@/lib/vector/embeddings", () => ({
  storePostEmbedding: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { enqueuePost } from "@/lib/queue/qstash";
import { publishToX } from "@/lib/x/publish";

const update = vi.mocked(prisma.post.update);
const enqueue = vi.mocked(enqueuePost);
const publish = vi.mocked(publishToX);

describe("dispatchPostPublish", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.QSTASH_TOKEN;
    update.mockResolvedValue({ id: "post_1", status: "PUBLISHED" } as never);
  });

  it("publishes immediately when QStash is not configured", async () => {
    publish.mockResolvedValue({ id: "tweet_1", url: "https://x.com/i/status/tweet_1" });
    const result = await dispatchPostPublish({
      postId: "post_1",
      projectId: "proj_1",
      userId: "user_1",
      content: "hello from xoopa",
      mediaUrls: [],
      scheduledAt: null,
    });
    expect(hasQStash()).toBe(false);
    expect(publish).toHaveBeenCalledWith("user_1", "hello from xoopa", []);
    expect(enqueue).not.toHaveBeenCalled();
    expect(result.mode).toBe("published");
  });

  it("queues through QStash when a token is present", async () => {
    process.env.QSTASH_TOKEN = "qstash-token";
    enqueue.mockResolvedValue("job_1");
    update.mockResolvedValue({ id: "post_1", status: "QUEUED" } as never);
    const result = await dispatchPostPublish({
      postId: "post_1",
      projectId: "proj_1",
      userId: "user_1",
      content: "hello from xoopa",
      mediaUrls: [],
      scheduledAt: null,
    });
    expect(enqueue).toHaveBeenCalled();
    expect(publish).not.toHaveBeenCalled();
    expect(result.mode).toBe("queued");
  });
});
