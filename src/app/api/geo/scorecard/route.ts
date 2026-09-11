import { NextResponse } from "next/server";
import { PLAN_LIMITS } from "@/lib/billing/plans";
import { getBaseUrl } from "@/lib/env";
import {
  buildScorecardPayload,
  generateScorecardSlug,
} from "@/lib/geo/scorecard";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

async function loadOwnerState(userId: string) {
  const [user, usageTier] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        planTier: true,
        scorecardPublic: true,
        scorecardSlug: true,
        scorecardPublishedAt: true,
      },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { planTier: true },
    }),
  ]);

  if (!user) return null;

  const planTier = usageTier?.planTier ?? "FREE";
  const publicScorecardLimit = PLAN_LIMITS[planTier].publicScorecards;
  const preview = await buildScorecardPayload(userId);
  const slug = user.scorecardSlug;
  const base = getBaseUrl();

  return {
    public: user.scorecardPublic,
    slug,
    publishedAt: user.scorecardPublishedAt?.toISOString() ?? null,
    publicUrl: user.scorecardPublic && slug ? `${base}/score/${slug}` : null,
    brandName: preview.brandName,
    publicScorecardLimit,
    preview,
  };
}

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const state = await loadOwnerState(session.user.id);
  if (!state) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(state);
}

type PatchBody = {
  public?: boolean;
  regenerateSlug?: boolean;
};

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      planTier: true,
      scorecardPublic: true,
      scorecardSlug: true,
    },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const limit = PLAN_LIMITS[user.planTier].publicScorecards;
  if (limit < 1) {
    return NextResponse.json(
      { error: "Public scorecards are not available on this plan." },
      { status: 403 }
    );
  }

  const preview = await buildScorecardPayload(userId);
  const data: {
    scorecardPublic?: boolean;
    scorecardSlug?: string | null;
    scorecardPublishedAt?: Date | null;
  } = {};

  if (typeof body.public === "boolean") {
    if (body.public) {
      data.scorecardPublic = true;
      data.scorecardPublishedAt = new Date();
      if (!user.scorecardSlug) {
        data.scorecardSlug = generateScorecardSlug(preview.brandName);
      }
    } else {
      // Immediate unpublish — public route 404s on next request.
      data.scorecardPublic = false;
      data.scorecardPublishedAt = null;
    }
  }

  if (body.regenerateSlug) {
    data.scorecardSlug = generateScorecardSlug(preview.brandName);
    if (user.scorecardPublic || body.public) {
      data.scorecardPublishedAt = new Date();
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { error: "Provide public and/or regenerateSlug." },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id: userId },
    data,
  });

  const state = await loadOwnerState(userId);
  return NextResponse.json(state);
}
