import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { CitationModel, SuggestionStatus } from "@prisma/client";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { listCitationGaps } from "@/lib/geo/citation-gaps";
import {
  FixSuggestionError,
  generateFixSuggestion,
} from "@/lib/geo/generate-fix-suggestion";
import {
  UsageLimitError,
  assertCanRegenerateSuggestion,
  gateSuggestionGeneration,
  getUsage,
} from "@/lib/billing/limits";
import { BILLING_UPGRADE_PATH } from "@/lib/billing/plans";
import { CITATION_MODELS } from "@/lib/geo/citation-analytics";
import { normalizePublishedUrl } from "@/lib/geo/normalize-published-url";
import {
  OUTCOME_AWAITING_RUN_THRESHOLD,
  buildOutcomeAggregate,
  deriveOutcomeStatus,
} from "@/lib/geo/suggestion-outcomes";

export const dynamic = "force-dynamic";

const citationModelSchema = z.enum(
  CITATION_MODELS as [CitationModel, ...CitationModel[]]
);

function serializeSuggestion(
  s: {
    id: string;
    trackedQueryId: string;
    model: CitationModel;
    suggestionText: string;
    status: SuggestionStatus;
    regenerationCount: number;
    createdAt: Date;
    publishedUrl: string | null;
    publishedAt: Date | null;
    trackedQuery: { brandName: string; promptText: string };
    outcomes?: Array<{
      id: string;
      matchType: "EXACT" | "DOMAIN";
      model: CitationModel;
      matchedAt: Date;
      citationRunId: string;
    }>;
  },
  meta?: { runsAfterPublish: number }
) {
  const outcomes = (s.outcomes ?? []).map((o) => ({
    id: o.id,
    matchType: o.matchType,
    model: o.model,
    matchedAt: o.matchedAt.toISOString(),
    citationRunId: o.citationRunId,
  }));
  const exactCount = outcomes.filter((o) => o.matchType === "EXACT").length;
  const domainCount = outcomes.filter((o) => o.matchType === "DOMAIN").length;
  const runsAfterPublish = meta?.runsAfterPublish ?? 0;
  const outcomeStatus = deriveOutcomeStatus({
    status: s.status,
    publishedUrl: s.publishedUrl,
    publishedAt: s.publishedAt,
    runsAfterPublish,
    exactCount,
    domainCount,
  });

  return {
    id: s.id,
    trackedQueryId: s.trackedQueryId,
    model: s.model,
    suggestionText: s.suggestionText,
    status: s.status,
    regenerationCount: s.regenerationCount,
    createdAt: s.createdAt.toISOString(),
    publishedUrl: s.publishedUrl,
    publishedAt: s.publishedAt?.toISOString() ?? null,
    brandName: s.trackedQuery.brandName,
    promptText: s.trackedQuery.promptText,
    outcomes,
    runsAfterPublish,
    outcomeStatus,
    awaitingRunThreshold: OUTCOME_AWAITING_RUN_THRESHOLD,
  };
}

/** List open (NEW) suggestions + current gaps for the Fixes UI. */
export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [gaps, suggestions, usage] = await Promise.all([
    listCitationGaps(session.user.id),
    prisma.contentSuggestion.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        trackedQuery: {
          select: { brandName: true, promptText: true },
        },
        outcomes: {
          orderBy: { matchedAt: "desc" },
          take: 20,
        },
      },
    }),
    getUsage(session.user.id),
  ]);

  // Successful runs after each publishedAt (batched per distinct query+time).
  const cache = new Map<string, number>();
  const runsBySuggestion = new Map<string, number>();
  await Promise.all(
    suggestions.map(async (s) => {
      if (!s.publishedAt) {
        runsBySuggestion.set(s.id, 0);
        return;
      }
      const key = `${s.trackedQueryId}|${s.publishedAt.toISOString()}`;
      let count = cache.get(key);
      if (count === undefined) {
        count = await prisma.citationRun.count({
          where: {
            trackedQueryId: s.trackedQueryId,
            error: null,
            runAt: { gt: s.publishedAt },
          },
        });
        cache.set(key, count);
      }
      runsBySuggestion.set(s.id, count);
    })
  );

  const serialized = suggestions.map((s) =>
    serializeSuggestion(s, {
      runsAfterPublish: runsBySuggestion.get(s.id) ?? 0,
    })
  );

  const outcomeSummary = buildOutcomeAggregate(
    serialized.map((s) => ({
      status: s.status,
      publishedUrl: s.publishedUrl,
      runsAfterPublish: s.runsAfterPublish,
      exactCount: s.outcomes.filter((o) => o.matchType === "EXACT").length,
      domainCount: s.outcomes.filter((o) => o.matchType === "DOMAIN").length,
    }))
  );

  return NextResponse.json({
    gaps,
    suggestions: serialized,
    outcomeSummary,
    usage: {
      planTier: usage.planTier,
      suggestionGenerationsPerMonth: usage.suggestionGenerationsPerMonth,
      suggestionGenerationCount: usage.suggestionGenerationCount,
      suggestionSoftCap: usage.suggestionSoftCap,
      upgradePath: BILLING_UPGRADE_PATH,
    },
  });
}

/** Generate a NEW suggestion for a specific gap. */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = z
    .object({
      trackedQueryId: z.string().min(1),
      model: citationModelSchema,
    })
    .safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const trackedQuery = await prisma.trackedQuery.findFirst({
    where: { id: parsed.data.trackedQueryId, userId: session.user.id },
  });
  if (!trackedQuery) {
    return NextResponse.json({ error: "Tracked query not found" }, { status: 404 });
  }

  let softWarned = false;
  try {
    const gate = await gateSuggestionGeneration(session.user.id);
    softWarned = gate.softWarned;
  } catch (err) {
    if (err instanceof UsageLimitError) {
      return NextResponse.json(
        {
          error: err.message,
          code: err.code,
          upgradePath: err.upgradePath,
        },
        { status: 403 }
      );
    }
    throw err;
  }

  const gaps = await listCitationGaps(session.user.id);
  const gap = gaps.find(
    (g) =>
      g.trackedQueryId === parsed.data.trackedQueryId &&
      g.model === parsed.data.model
  );
  if (!gap) {
    return NextResponse.json(
      {
        error:
          "No citation gap for that query/model right now. Gaps require successful runs with a miss or low mention rate.",
      },
      { status: 409 }
    );
  }

  let generated;
  try {
    generated = await generateFixSuggestion({
      brandName: gap.brandName,
      promptText: gap.promptText,
      model: gap.model,
      modelLabel: gap.modelLabel,
      mentionRate: gap.mentionRate,
      runsConsidered: gap.runsConsidered,
      latestMissed: gap.latestMissed,
    });
  } catch (err) {
    if (err instanceof FixSuggestionError) {
      console.error("[suggestions] generate failed:", err.message);
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    throw err;
  }

  const suggestion = await prisma.contentSuggestion.create({
    data: {
      userId: session.user.id,
      trackedQueryId: gap.trackedQueryId,
      model: gap.model,
      suggestionText: generated.suggestionText,
      status: "NEW",
    },
    include: {
      trackedQuery: { select: { brandName: true, promptText: true } },
      outcomes: true,
    },
  });

  return NextResponse.json(
    {
      suggestion: serializeSuggestion(suggestion, { runsAfterPublish: 0 }),
      fairUseWarning: softWarned
        ? "Fair-use notice: you are over the Pro soft cap of 75 content suggestions this month."
        : null,
    },
    { status: 201 }
  );
}

/** Update status (dismiss / mark actioned), publish URL, or regenerate. */
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = z
    .object({
      id: z.string().min(1),
      status: z.enum(["DISMISSED", "ACTIONED", "NEW"]).optional(),
      regenerate: z.boolean().optional(),
      publishedUrl: z.string().nullable().optional(),
    })
    .safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (
    !parsed.data.status &&
    !parsed.data.regenerate &&
    parsed.data.publishedUrl === undefined
  ) {
    return NextResponse.json(
      { error: "Provide status, publishedUrl, and/or regenerate" },
      { status: 400 }
    );
  }

  const existing = await prisma.contentSuggestion.findFirst({
    where: { id: parsed.data.id, userId: session.user.id },
    include: {
      trackedQuery: { select: { brandName: true, promptText: true } },
      outcomes: { orderBy: { matchedAt: "desc" }, take: 20 },
    },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (parsed.data.regenerate) {
    let regenMeta;
    try {
      regenMeta = await assertCanRegenerateSuggestion(session.user.id, {
        regenerationCount: existing.regenerationCount,
        regenerationWindowStart: existing.regenerationWindowStart,
      });
    } catch (err) {
      if (err instanceof UsageLimitError) {
        return NextResponse.json(
          {
            error: err.message,
            code: err.code,
            upgradePath: err.upgradePath,
          },
          { status: 403 }
        );
      }
      throw err;
    }

    const gaps = await listCitationGaps(session.user.id);
    const gap = gaps.find(
      (g) =>
        g.trackedQueryId === existing.trackedQueryId &&
        g.model === existing.model
    );

    // Allow regenerate even if gap closed — still useful context — but prefer live gap stats.
    const context = gap ?? {
      brandName: existing.trackedQuery.brandName,
      promptText: existing.trackedQuery.promptText,
      model: existing.model,
      modelLabel: existing.model,
      mentionRate: 0,
      runsConsidered: 0,
      latestMissed: true,
    };

    let generated;
    try {
      generated = await generateFixSuggestion({
        brandName: context.brandName,
        promptText: context.promptText,
        model: context.model,
        modelLabel:
          "modelLabel" in context && typeof context.modelLabel === "string"
            ? context.modelLabel
            : String(existing.model),
        mentionRate: context.mentionRate,
        runsConsidered: context.runsConsidered,
        latestMissed: context.latestMissed,
      });
    } catch (err) {
      if (err instanceof FixSuggestionError) {
        console.error("[suggestions] regenerate failed:", err.message);
        return NextResponse.json({ error: err.message }, { status: 502 });
      }
      throw err;
    }

    const updated = await prisma.contentSuggestion.update({
      where: { id: existing.id },
      data: {
        suggestionText: generated.suggestionText,
        status: "NEW",
        regenerationCount: regenMeta.count + 1,
        regenerationWindowStart: regenMeta.windowStart,
        publishedUrl: null,
        publishedAt: null,
      },
      include: {
        trackedQuery: { select: { brandName: true, promptText: true } },
        outcomes: { orderBy: { matchedAt: "desc" }, take: 20 },
      },
    });

    return NextResponse.json({
      suggestion: serializeSuggestion(updated, { runsAfterPublish: 0 }),
      fairUseWarning: regenMeta.softWarned
        ? "Fair-use notice: you are over the Pro soft cap of 75 content suggestions this month."
        : null,
    });
  }

  const data: {
    status?: SuggestionStatus;
    publishedUrl?: string | null;
    publishedAt?: Date | null;
  } = {};

  if (parsed.data.status) {
    data.status = parsed.data.status as SuggestionStatus;
  }

  if (parsed.data.publishedUrl !== undefined) {
    const nextStatus = data.status ?? existing.status;
    if (nextStatus !== "ACTIONED" && existing.status !== "ACTIONED") {
      return NextResponse.json(
        { error: "Mark the suggestion as actioned before saving a published URL" },
        { status: 400 }
      );
    }
    if (parsed.data.publishedUrl === null || parsed.data.publishedUrl.trim() === "") {
      data.publishedUrl = null;
      data.publishedAt = null;
    } else {
      const normalized = normalizePublishedUrl(parsed.data.publishedUrl);
      if (!normalized) {
        return NextResponse.json(
          { error: "That does not look like a valid URL" },
          { status: 400 }
        );
      }
      data.publishedUrl = normalized.canonical;
      data.publishedAt = new Date();
      if (!data.status) {
        data.status = "ACTIONED";
      }
    }
  }

  const updated = await prisma.contentSuggestion.update({
    where: { id: existing.id },
    data,
    include: {
      trackedQuery: { select: { brandName: true, promptText: true } },
      outcomes: { orderBy: { matchedAt: "desc" }, take: 20 },
    },
  });

  let runsAfterPublish = 0;
  if (updated.publishedAt) {
    runsAfterPublish = await prisma.citationRun.count({
      where: {
        trackedQueryId: updated.trackedQueryId,
        error: null,
        runAt: { gt: updated.publishedAt },
      },
    });
  }

  return NextResponse.json({
    suggestion: serializeSuggestion(updated, { runsAfterPublish }),
  });
}
