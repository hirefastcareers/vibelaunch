import { prisma } from "@/lib/prisma";
import { XApiError } from "@/lib/x/publish";
import { getValidAccessToken, XAuthError } from "@/lib/x/token";

export interface ReplyFeedItem {
  id: string;
  author: string;
  content: string;
  url: string;
  createdAt?: string;
}

export type ReplyFeeds = Record<string, ReplyFeedItem[]>;

export interface RepliesFeedResult {
  feeds: ReplyFeeds;
  configured: boolean;
  sources: {
    mentions: boolean;
    keywords: boolean;
  };
  project: { id: string; name: string; keywords: string[] } | null;
  warning?: string;
}

interface XTweet {
  id: string;
  text: string;
  author_id?: string;
  created_at?: string;
}

interface XUser {
  id: string;
  username?: string;
}

/** Bearer token for app-only recent search (X_BEARER_TOKEN or X_API_KEY). */
export function getXBearerToken(): string | null {
  const token =
    process.env.X_BEARER_TOKEN?.trim() || process.env.X_API_KEY?.trim() || "";
  return token || null;
}

function usernameMap(includes?: { users?: XUser[] }): Map<string, string> {
  const map = new Map<string, string>();
  for (const user of includes?.users ?? []) {
    if (user.username) map.set(user.id, user.username);
  }
  return map;
}

function toFeedItem(
  tweet: XTweet,
  authors: Map<string, string>
): ReplyFeedItem {
  const username = tweet.author_id
    ? authors.get(tweet.author_id) ?? "i"
    : "i";
  return {
    id: tweet.id,
    author: `@${username}`,
    content: tweet.text,
    url: `https://x.com/${username}/status/${tweet.id}`,
    createdAt: tweet.created_at,
  };
}

/**
 * Mentions of the signed-in user via user-context OAuth (tweet.read).
 */
export async function fetchUserMentions(
  userId: string,
  maxResults = 20
): Promise<ReplyFeedItem[]> {
  const [accessToken, user] = await Promise.all([
    getValidAccessToken(userId),
    prisma.user.findUnique({
      where: { id: userId },
      select: { xUserId: true, xUsername: true },
    }),
  ]);

  const xUserId = user?.xUserId;
  if (!xUserId) {
    throw new XAuthError(
      "X profile id is missing. Sign out and sign in with X again.",
      "REAUTH_REQUIRED"
    );
  }

  const params = new URLSearchParams({
    max_results: String(Math.min(Math.max(maxResults, 5), 100)),
    expansions: "author_id",
    "tweet.fields": "created_at,author_id",
    "user.fields": "username",
  });

  const response = await fetch(
    `https://api.x.com/2/users/${xUserId}/mentions?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new XApiError(
      `X mentions error: ${response.status} ${error}`,
      response.status
    );
  }

  const data = (await response.json()) as {
    data?: XTweet[];
    includes?: { users?: XUser[] };
  };

  const authors = usernameMap(data.includes);
  return (data.data ?? []).map((tweet) => toFeedItem(tweet, authors));
}

/**
 * Recent keyword search via app bearer token.
 */
export async function searchRecentByKeyword(
  keyword: string,
  options: {
    bearerToken: string;
    excludeUsername?: string | null;
    maxResults?: number;
  }
): Promise<ReplyFeedItem[]> {
  const queryParts = [`(${keyword})`, "-is:retweet", "lang:en"];
  if (options.excludeUsername) {
    queryParts.push(`-from:${options.excludeUsername.replace(/^@/, "")}`);
  }

  const params = new URLSearchParams({
    query: queryParts.join(" "),
    max_results: String(Math.min(Math.max(options.maxResults ?? 10, 10), 100)),
    expansions: "author_id",
    "tweet.fields": "created_at,author_id",
    "user.fields": "username",
  });

  const response = await fetch(
    `https://api.x.com/2/tweets/search/recent?${params}`,
    { headers: { Authorization: `Bearer ${options.bearerToken}` } }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new XApiError(
      `X search error: ${response.status} ${error}`,
      response.status
    );
  }

  const data = (await response.json()) as {
    data?: XTweet[];
    includes?: { users?: XUser[] };
  };

  const authors = usernameMap(data.includes);
  return (data.data ?? []).map((tweet) => toFeedItem(tweet, authors));
}

/**
 * Build the replies inbox: @mentions plus optional project keyword searches.
 */
export async function buildRepliesFeed(userId: string): Promise<RepliesFeedResult> {
  const project = await prisma.project.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, keywords: true },
  });

  const feeds: ReplyFeeds = {};
  const sources = { mentions: false, keywords: false };
  const warnings: string[] = [];

  try {
    const mentions = await fetchUserMentions(userId);
    sources.mentions = true;
    if (mentions.length > 0) {
      feeds["@mentions"] = mentions;
    }
  } catch (error) {
    if (error instanceof XAuthError && error.code === "NO_ACCOUNT") {
      return {
        feeds: {},
        configured: false,
        sources,
        project: project
          ? { id: project.id, name: project.name, keywords: project.keywords }
          : null,
        warning: "Connect X to load mentions and draft replies.",
      };
    }
    warnings.push(
      error instanceof Error ? error.message : "Could not load mentions."
    );
  }

  const bearer = getXBearerToken();
  const keywords = (project?.keywords ?? []).filter(Boolean).slice(0, 4);

  if (bearer && keywords.length > 0) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { xUsername: true },
    });

    for (const keyword of keywords) {
      try {
        const items = await searchRecentByKeyword(keyword, {
          bearerToken: bearer,
          excludeUsername: user?.xUsername,
          maxResults: 10,
        });
        sources.keywords = true;
        if (items.length > 0) {
          feeds[keyword] = items;
        }
      } catch (error) {
        warnings.push(
          error instanceof Error
            ? `Keyword "${keyword}": ${error.message}`
            : `Keyword "${keyword}" search failed.`
        );
      }
    }
  } else if (keywords.length > 0 && !bearer) {
    warnings.push(
      "Set X_BEARER_TOKEN (or X_API_KEY) to search project keywords. Mentions still work with your X login."
    );
  }

  const configured = sources.mentions || sources.keywords;

  return {
    feeds,
    configured,
    sources,
    project: project
      ? { id: project.id, name: project.name, keywords: project.keywords }
      : null,
    warning: warnings.length > 0 ? warnings.join(" ") : undefined,
  };
}
