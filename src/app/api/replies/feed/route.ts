import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  fetchUserMentions,
  getAppSearchBearer,
  isRepliesSearchConfigured,
  searchRecentByKeyword,
  type SearchTweet,
} from "@/lib/x/search";
import { XAuthError } from "@/lib/x/token";
import { XApiError } from "@/lib/x/publish";

export const dynamic = "force-dynamic";

const MAX_KEYWORDS = 5;
const PER_KEYWORD = 10;

function collectKeywords(
  projects: Array<{ name: string; keywords: string[] }>
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const project of projects) {
    for (const raw of project.keywords) {
      const kw = raw.trim();
      if (!kw) continue;
      const key = kw.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(kw);
      if (out.length >= MAX_KEYWORDS) return out;
    }
  }

  if (out.length === 0) {
    for (const project of projects) {
      const name = project.name.trim();
      if (!name) continue;
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(name);
      if (out.length >= MAX_KEYWORDS) break;
    }
  }

  return out;
}

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const [user, projects, account] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { xUserId: true, xUsername: true },
    }),
    prisma.project.findMany({
      where: { userId, status: { not: "ARCHIVED" } },
      select: {
        name: true,
        keywords: true,
        tagline: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.account.findFirst({
      where: { userId, provider: "twitter" },
      select: { access_token: true },
    }),
  ]);

  const hasUserToken = Boolean(account?.access_token);
  const configured = isRepliesSearchConfigured(hasUserToken);

  if (!configured) {
    return NextResponse.json({
      feeds: {},
      configured: false,
      keywords: [],
      projectName: projects[0]?.name ?? null,
      reason: "Connect X (and optionally set X_API_KEY / X_BEARER_TOKEN) to load a live feed.",
    });
  }

  const keywords = collectKeywords(projects);
  const feeds: Record<string, SearchTweet[]> = {};
  const errors: string[] = [];

  for (const keyword of keywords) {
    try {
      const items = await searchRecentByKeyword(userId, keyword, PER_KEYWORD);
      if (items.length > 0) {
        feeds[keyword] = items;
      }
    } catch (error) {
      const message =
        error instanceof XApiError || error instanceof XAuthError
          ? error.message
          : "Keyword search failed";
      console.error("[replies/feed] search", keyword, error);
      errors.push(`${keyword}: ${message}`);
    }
  }

  if (user?.xUserId && hasUserToken) {
    try {
      const mentions = await fetchUserMentions(userId, user.xUserId, PER_KEYWORD);
      if (mentions.length > 0) {
        feeds["@mentions"] = mentions;
      }
    } catch (error) {
      const message =
        error instanceof XApiError || error instanceof XAuthError
          ? error.message
          : "Mentions fetch failed";
      console.error("[replies/feed] mentions", error);
      errors.push(`@mentions: ${message}`);
    }
  }

  return NextResponse.json({
    feeds,
    configured: true,
    keywords,
    projectName: projects[0]?.name ?? null,
    authMode: getAppSearchBearer() ? "app" : "user",
    errors: errors.length > 0 ? errors : undefined,
  });
}
