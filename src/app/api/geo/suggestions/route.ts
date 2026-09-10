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
  getUsage,
} from "@/lib/billing/limits";
import { CITATION_MODELS } from "@/lib/geo/citation-analytics";

export const dynamic = "force-dynamic";

const citationModelSchema = z.enum(
  CITATION_MODELS as [CitationModel, ...CitationModel[]]
);

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
      },
    }),
    getUsage(session.user.id),
  ]);

  return NextResponse.json({
    gaps,
    suggestions: suggestions.map((s) => ({
      id: s.id,
      trackedQueryId: s.trackedQueryId,
      model: s.model,
      suggestionText: s.suggestionText,
      status: s.status,
      regenerationCount: s.regenerationCount,
      createdAt: s.createdAt.toISOString(),
      brandName: s.trackedQuery.brandName,
      promptText: s.trackedQuery.promptText,
    })),
    usage: {
      planTier: usage.planTier,
      suggestionRegensPerDay: usage.suggestionRegensPerDay,
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
  });

  return NextResponse.json(
    {
      suggestion: {
        id: suggestion.id,
        trackedQueryId: suggestion.trackedQueryId,
        model: suggestion.model,
        suggestionText: suggestion.suggestionText,
        status: suggestion.status,
        regenerationCount: suggestion.regenerationCount,
        createdAt: suggestion.createdAt.toISOString(),
        brandName: gap.brandName,
        promptText: gap.promptText,
      },
    },
    { status: 201 }
  );
}

/** Update status (dismiss / mark actioned) or regenerate. */
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
    })
    .safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!parsed.data.status && !parsed.data.regenerate) {
    return NextResponse.json(
      { error: "Provide status and/or regenerate" },
      { status: 400 }
    );
  }

  const existing = await prisma.contentSuggestion.findFirst({
    where: { id: parsed.data.id, userId: session.user.id },
    include: {
      trackedQuery: { select: { brandName: true, promptText: true } },
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
          { error: err.message, code: err.code },
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
      },
    });

    return NextResponse.json({
      suggestion: {
        id: updated.id,
        trackedQueryId: updated.trackedQueryId,
        model: updated.model,
        suggestionText: updated.suggestionText,
        status: updated.status,
        regenerationCount: updated.regenerationCount,
        createdAt: updated.createdAt.toISOString(),
        brandName: existing.trackedQuery.brandName,
        promptText: existing.trackedQuery.promptText,
      },
    });
  }

  const status = parsed.data.status as SuggestionStatus;
  const updated = await prisma.contentSuggestion.update({
    where: { id: existing.id },
    data: { status },
  });

  return NextResponse.json({
    suggestion: {
      id: updated.id,
      trackedQueryId: updated.trackedQueryId,
      model: updated.model,
      suggestionText: updated.suggestionText,
      status: updated.status,
      regenerationCount: updated.regenerationCount,
      createdAt: updated.createdAt.toISOString(),
      brandName: existing.trackedQuery.brandName,
      promptText: existing.trackedQuery.promptText,
    },
  });
}
