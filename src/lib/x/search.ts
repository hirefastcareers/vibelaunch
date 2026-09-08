import { getValidAccessToken, XAuthError } from "@/lib/x/token";
import { XApiError } from "@/lib/x/publish";

export interface SearchTweet {
  id: string;
  author: string;
  content: string;
  url: string;
}

interface TweetData {
  id: string;
  text: string;
  author_id?: string;
}

interface UserData {
  id: string;
  username?: string;
  name?: string;
}

/**
 * Bearer for public recent search. Prefer an app-only token when set;
 * otherwise use the signed-in user's OAuth access token.
 */
export function getAppSearchBearer(): string | null {
  const bearer =
    process.env.X_BEARER_TOKEN?.trim() ||
    process.env.X_API_KEY?.trim() ||
    "";
  return bearer || null;
}

export function isRepliesSearchConfigured(hasUserToken: boolean): boolean {
  return Boolean(getAppSearchBearer() || hasUserToken);
}

function buildSearchQuery(keyword: string): string {
  const trimmed = keyword.trim();
  if (!trimmed) return "";
  const phrase = /\s/.test(trimmed) || trimmed.startsWith("#")
    ? trimmed
    : trimmed;
  const quoted =
    /\s/.test(phrase) && !phrase.startsWith('"') ? `"${phrase}"` : phrase;
  return `(${quoted}) -is:retweet -is:reply lang:en`;
}

async function resolveSearchToken(userId: string): Promise<string> {
  const appBearer = getAppSearchBearer();
  if (appBearer) return appBearer;

  try {
    return await getValidAccessToken(userId);
  } catch (error) {
    if (error instanceof XAuthError) {
      throw error;
    }
    throw new XAuthError("X account not connected", "NO_ACCOUNT");
  }
}

function mapTweets(
  tweets: TweetData[] | undefined,
  users: UserData[] | undefined
): SearchTweet[] {
  if (!tweets?.length) return [];
  const byId = new Map((users ?? []).map((u) => [u.id, u]));

  return tweets.map((tweet) => {
    const user = tweet.author_id ? byId.get(tweet.author_id) : undefined;
    const username = user?.username ?? "i";
    return {
      id: tweet.id,
      author: username.startsWith("@") ? username : `@${username}`,
      content: tweet.text,
      url: `https://x.com/${username}/status/${tweet.id}`,
    };
  });
}

/**
 * Search recent public posts for a keyword (last 7 days).
 */
export async function searchRecentByKeyword(
  userId: string,
  keyword: string,
  maxResults = 10
): Promise<SearchTweet[]> {
  const query = buildSearchQuery(keyword);
  if (!query) return [];

  const accessToken = await resolveSearchToken(userId);
  const params = new URLSearchParams({
    query,
    max_results: String(Math.min(100, Math.max(10, maxResults))),
    "tweet.fields": "author_id,created_at,public_metrics",
    expansions: "author_id",
    "user.fields": "username,name",
  });

  const response = await fetch(
    `https://api.x.com/2/tweets/search/recent?${params}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      next: { revalidate: 0 },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new XApiError(
      `X search failed: ${response.status} ${error}`,
      response.status
    );
  }

  const data = (await response.json()) as {
    data?: TweetData[];
    includes?: { users?: UserData[] };
  };

  return mapTweets(data.data, data.includes?.users);
}

/**
 * Fetch recent mentions of the signed-in X user.
 */
export async function fetchUserMentions(
  userId: string,
  xUserId: string,
  maxResults = 10
): Promise<SearchTweet[]> {
  const accessToken = await getValidAccessToken(userId);
  const params = new URLSearchParams({
    max_results: String(Math.min(100, Math.max(5, maxResults))),
    "tweet.fields": "author_id,created_at,public_metrics",
    expansions: "author_id",
    "user.fields": "username,name",
  });

  const response = await fetch(
    `https://api.x.com/2/users/${xUserId}/mentions?${params}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      next: { revalidate: 0 },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new XApiError(
      `X mentions failed: ${response.status} ${error}`,
      response.status
    );
  }

  const data = (await response.json()) as {
    data?: TweetData[];
    includes?: { users?: UserData[] };
  };

  return mapTweets(data.data, data.includes?.users);
}
