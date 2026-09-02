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

const SUPPORTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

function normalizeMediaType(header: string | null): string {
  return (header ?? "").split(";")[0].trim().toLowerCase();
}

async function uploadMedia(accessToken: string, mediaUrl: string): Promise<string> {
  const imageResponse = await fetch(mediaUrl);
  if (!imageResponse.ok) {
    throw new Error(`Failed to fetch media: ${mediaUrl}`);
  }

  const mediaType = normalizeMediaType(imageResponse.headers.get("content-type"));
  if (!SUPPORTED_IMAGE_TYPES.has(mediaType)) {
    throw new XApiError(
      "Video/non-image media upload isn't implemented yet — only JPEG/PNG/GIF/WEBP images are supported",
      422
    );
  }

  const bytes = new Uint8Array(await imageResponse.arrayBuffer());
  const form = new FormData();
  form.append(
    "media",
    new Blob([bytes], { type: mediaType }),
    `image.${IMAGE_EXTENSIONS[mediaType]}`
  );
  form.append("media_category", "tweet_image");
  form.append("media_type", mediaType);

  // v2 simple (non-chunked) image upload: multipart/form-data with media +
  // media_category, not a raw binary POST. fetch sets the multipart boundary;
  // do not override Content-Type (that was the old octet-stream bug).
  const uploadResponse = await fetch("https://api.x.com/2/media/upload", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  });

  if (!uploadResponse.ok) {
    const error = await uploadResponse.text();
    throw new XApiError(`Media upload failed: ${uploadResponse.status} ${error}`, uploadResponse.status);
  }

  const uploadData = (await uploadResponse.json()) as { data?: { id?: string } };
  const mediaId = uploadData.data?.id;
  if (!mediaId) {
    throw new XApiError("Media upload failed: response missing media id", 502);
  }
  return mediaId;
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
