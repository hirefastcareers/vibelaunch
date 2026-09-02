import { prisma } from "@/lib/prisma";
import { getValidAccessToken } from "@/lib/x/token";

export { XAuthError } from "@/lib/x/token";

export interface XPostResult {
  id: string;
  url: string;
}

export class XApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = "XApiError";
  }
}

/**
 * Publish a tweet to X using the user's OAuth access token.
 */
export async function publishToX(
  userId: string,
  content: string,
  mediaUrls?: string[]
): Promise<XPostResult> {
  const accessToken = await getValidAccessToken(userId);

  const mediaIds: string[] = [];
  if (mediaUrls?.length) {
    for (const url of mediaUrls) {
      const mediaId = await uploadMedia(accessToken, url);
      mediaIds.push(mediaId);
    }
  }

  const tweetBody: Record<string, unknown> = { text: content };
  if (mediaIds.length > 0) {
    tweetBody.media = { media_ids: mediaIds };
  }

  const response = await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(tweetBody),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new XApiError(`X API error: ${response.status} ${error}`, response.status);
  }

  const data = (await response.json()) as { data: { id: string } };
  const tweetId = data.data.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { xUsername: true },
  });

  const username = user?.xUsername ?? "i";
  return {
    id: tweetId,
    url: `https://x.com/${username}/status/${tweetId}`,
  };
}

async function uploadMedia(accessToken: string, mediaUrl: string): Promise<string> {
  const imageResponse = await fetch(mediaUrl);
  if (!imageResponse.ok) {
    throw new Error(`Failed to fetch media: ${mediaUrl}`);
  }
  const buffer = Buffer.from(await imageResponse.arrayBuffer());

  const uploadResponse = await fetch("https://upload.twitter.com/1.1/media/upload.json", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/octet-stream",
    },
    body: buffer,
  });

  if (!uploadResponse.ok) {
    const error = await uploadResponse.text();
    throw new XApiError(`Media upload failed: ${uploadResponse.status} ${error}`, uploadResponse.status);
  }

  const uploadData = (await uploadResponse.json()) as { media_id_string: string };
  return uploadData.media_id_string;
}

/**
 * Fetch engagement metrics for a published tweet.
 */
export async function fetchTweetMetrics(
  userId: string,
  tweetId: string
): Promise<{
  impressions: number;
  likes: number;
  retweets: number;
  replies: number;
}> {
  const accessToken = await getValidAccessToken(userId);

  const params = new URLSearchParams({
    ids: tweetId,
    "tweet.fields": "public_metrics",
  });

  const response = await fetch(
    `https://api.twitter.com/2/tweets?${params}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new XApiError(`X API error: ${response.status} ${error}`, response.status);
  }

  const data = (await response.json()) as {
    data?: Array<{
      public_metrics?: {
        impression_count?: number;
        like_count?: number;
        retweet_count?: number;
        reply_count?: number;
      };
    }>;
  };

  const metrics = data.data?.[0]?.public_metrics;
  return {
    impressions: metrics?.impression_count ?? 0,
    likes: metrics?.like_count ?? 0,
    retweets: metrics?.retweet_count ?? 0,
    replies: metrics?.reply_count ?? 0,
  };
}
