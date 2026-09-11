import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { CitationModel } from "@prisma/client";
import { getSession } from "@/lib/session";
import { CITATION_MODELS } from "@/lib/geo/citation-analytics";
import { GapAnalysisError } from "@/lib/geo/gap-analysis";
import {
  getCachedGapAnalysis,
  getOrCreateGapAnalysis,
  previewMissedDomains,
} from "@/lib/geo/gap-analysis-service";
import {
  UsageLimitError,
  gateSuggestionGeneration,
} from "@/lib/billing/limits";
import { BILLING_UPGRADE_PATH } from "@/lib/billing/plans";

export const dynamic = "force-dynamic";

const citationModelSchema = z.enum(
  CITATION_MODELS as [CitationModel, ...CitationModel[]]
);

/**
 * GET — domain preview + cached analysis if fingerprint still matches.
 * Never runs the LLM or page fetches.
 */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const trackedQueryId = req.nextUrl.searchParams.get("trackedQueryId");
  if (!trackedQueryId) {
    return NextResponse.json(
      { error: "trackedQueryId is required" },
      { status: 400 }
    );
  }

  const modelParam = req.nextUrl.searchParams.get("model");
  const modelParsed = modelParam
    ? citationModelSchema.safeParse(modelParam)
    : null;
  if (modelParsed && !modelParsed.success) {
    return NextResponse.json({ error: "Invalid model" }, { status: 400 });
  }

  const model = modelParsed?.success ? modelParsed.data : undefined;
  const summary = await previewMissedDomains(
    trackedQueryId,
    session.user.id,
    model
  );
  if (!summary) {
    return NextResponse.json(
      { error: "Tracked query not found" },
      { status: 404 }
    );
  }

  const cached = await getCachedGapAnalysis(
    trackedQueryId,
    session.user.id,
    summary.domainsFingerprint
  );

  return NextResponse.json({
    preview: {
      trackedQueryId: summary.trackedQueryId,
      brandName: summary.brandName,
      promptText: summary.promptText,
      missedRunCount: summary.missedRunCount,
      topDomains: summary.topDomains,
      domainsFingerprint: summary.domainsFingerprint,
    },
    analysis: cached
      ? { ...cached, missedRunCount: summary.missedRunCount }
      : null,
  });
}

/**
 * POST — on-demand generate (or return cache).
 * Shared suggestion monthly quota is charged only when the LLM runs.
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = z
    .object({
      trackedQueryId: z.string().min(1),
      model: citationModelSchema.optional(),
      force: z.boolean().optional(),
    })
    .safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const summary = await previewMissedDomains(
    parsed.data.trackedQueryId,
    session.user.id,
    parsed.data.model
  );
  if (!summary) {
    return NextResponse.json(
      { error: "Tracked query not found" },
      { status: 404 }
    );
  }

  if (!parsed.data.force) {
    const cached = await getCachedGapAnalysis(
      parsed.data.trackedQueryId,
      session.user.id,
      summary.domainsFingerprint
    );
    if (cached) {
      return NextResponse.json({
        analysis: { ...cached, missedRunCount: summary.missedRunCount },
        fairUseWarning: null,
      });
    }
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
          upgradePath: err.upgradePath ?? BILLING_UPGRADE_PATH,
        },
        { status: 403 }
      );
    }
    throw err;
  }

  try {
    const analysis = await getOrCreateGapAnalysis({
      trackedQueryId: parsed.data.trackedQueryId,
      userId: session.user.id,
      model: parsed.data.model,
      force: parsed.data.force ?? false,
    });

    return NextResponse.json({
      analysis,
      fairUseWarning: softWarned
        ? "Fair-use notice: you are over the Pro soft cap for content generations this month (suggestions + gap analyses share the same pool)."
        : null,
    });
  } catch (err) {
    if (err instanceof GapAnalysisError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
