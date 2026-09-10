import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { executeCitationSweepForQuery } from "@/lib/geo/citation-runner";
import {
  enqueueCitationSweep,
  isQStashConfigured,
} from "@/lib/queue/qstash";
import {
  UsageLimitError,
  assertCanCreateTrackedQueries,
  getUsage,
} from "@/lib/billing/limits";
import { BILLING_UPGRADE_PATH } from "@/lib/billing/plans";

export const dynamic = "force-dynamic";

/** List the current user's tracked queries (+ plan usage for the UI). */
export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [queries, usage] = await Promise.all([
    prisma.trackedQuery.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { runs: true } },
      },
    }),
    getUsage(session.user.id),
  ]);

  return NextResponse.json({
    queries,
    usage: {
      planTier: usage.planTier,
      trackedQueryCount: usage.trackedQueryCount,
      trackedQueryLimit: usage.trackedQueryLimit,
    },
  });
}

/** Create one or more tracked queries (brand + prompt). */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = z
    .object({
      brandName: z.string().trim().min(1).max(120),
      prompts: z
        .array(z.string().trim().min(3).max(1000))
        .min(1)
        .max(12)
        .optional(),
      promptText: z.string().trim().min(3).max(1000).optional(),
      runNow: z.boolean().optional(),
    })
    .safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const prompts =
    parsed.data.prompts ??
    (parsed.data.promptText ? [parsed.data.promptText] : []);

  if (prompts.length === 0) {
    return NextResponse.json(
      { error: "promptText or prompts[] is required" },
      { status: 400 }
    );
  }

  const userId = session.user.id;

  try {
    await assertCanCreateTrackedQueries(userId, prompts.length);
  } catch (err) {
    if (err instanceof UsageLimitError) {
      return NextResponse.json(
        { error: err.message, code: err.code, upgradePath: err.upgradePath ?? BILLING_UPGRADE_PATH },
        { status: 403 }
      );
    }
    throw err;
  }

  const created = await prisma.$transaction(
    prompts.map((promptText) =>
      prisma.trackedQuery.create({
        data: {
          userId,
          brandName: parsed.data.brandName,
          promptText,
          active: true,
        },
      })
    )
  );

  const runNow = parsed.data.runNow === true;
  const runs: Array<{ trackedQueryId: string; mode: string; detail?: unknown }> =
    [];

  if (runNow) {
    for (const query of created) {
      if (isQStashConfigured()) {
        try {
          const messageId = await enqueueCitationSweep({
            trackedQueryId: query.id,
          });
          runs.push({
            trackedQueryId: query.id,
            mode: "enqueued",
            detail: messageId,
          });
        } catch (err) {
          console.error(
            "[tracked-queries] enqueue failed, running inline",
            err
          );
          const outcomes = await executeCitationSweepForQuery(query.id);
          runs.push({
            trackedQueryId: query.id,
            mode: "inline",
            detail: outcomes.map((o) => ({ model: o.model, ok: o.ok })),
          });
        }
      } else {
        const outcomes = await executeCitationSweepForQuery(query.id);
        runs.push({
          trackedQueryId: query.id,
          mode: "inline",
          detail: outcomes.map((o) => ({ model: o.model, ok: o.ok })),
        });
      }
    }
  }

  return NextResponse.json({ queries: created, runs }, { status: 201 });
}

/** Patch active flag and/or prompt text. */
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = z
    .object({
      id: z.string().min(1),
      active: z.boolean().optional(),
      promptText: z.string().trim().min(3).max(1000).optional(),
      brandName: z.string().trim().min(1).max(120).optional(),
    })
    .safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (
    parsed.data.active === undefined &&
    parsed.data.promptText === undefined &&
    parsed.data.brandName === undefined
  ) {
    return NextResponse.json(
      { error: "Provide active, promptText, and/or brandName" },
      { status: 400 }
    );
  }

  const existing = await prisma.trackedQuery.findFirst({
    where: { id: parsed.data.id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.trackedQuery.update({
    where: { id: existing.id },
    data: {
      ...(parsed.data.active !== undefined
        ? { active: parsed.data.active }
        : {}),
      ...(parsed.data.promptText !== undefined
        ? { promptText: parsed.data.promptText }
        : {}),
      ...(parsed.data.brandName !== undefined
        ? { brandName: parsed.data.brandName }
        : {}),
    },
  });

  return NextResponse.json({ query: updated });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const existing = await prisma.trackedQuery.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.trackedQuery.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
