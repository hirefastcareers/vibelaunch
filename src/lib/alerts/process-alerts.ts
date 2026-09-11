import type {
  AlertDigestFrequency,
  AlertType,
  CitationModel,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  ALERT_CONFIRMATION_RUNS,
  detectRunChanges,
  type ObservedChange,
  type RunSnapshot,
} from "@/lib/alerts/detect-changes";
import {
  buildUnsubscribeUrl,
  isMailProviderConfigured,
  sendAlertEmail,
} from "@/lib/alerts/email";
import { deliverAlertWebhook } from "@/lib/alerts/webhook-deliver";
import { PLAN_LIMITS, type PlanTier } from "@/lib/billing/plans";

export async function ensureAlertPreference(userId: string) {
  return prisma.alertPreference.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}

function isTypeEnabled(
  prefs: {
    citationLostEnabled: boolean;
    citationGainedEnabled: boolean;
    competitorOvertakeEnabled: boolean;
    sentimentFlipEnabled: boolean;
  },
  type: AlertType
): boolean {
  switch (type) {
    case "CITATION_LOST":
      return prefs.citationLostEnabled;
    case "CITATION_GAINED":
      return prefs.citationGainedEnabled;
    case "COMPETITOR_OVERTAKE":
      return prefs.competitorOvertakeEnabled;
    case "SENTIMENT_FLIP":
      return prefs.sentimentFlipEnabled;
    default:
      return false;
  }
}

/** Whether a previously observed change still holds on the latest run. */
export function changeStillHolds(
  change: Pick<ObservedChange, "type" | "detail">,
  current: RunSnapshot
): boolean {
  switch (change.type) {
    case "CITATION_LOST":
      return !current.brandMentioned;
    case "CITATION_GAINED":
      return current.brandMentioned;
    case "SENTIMENT_FLIP":
      return current.brandMentioned && current.sentiment === "negative";
    case "COMPETITOR_OVERTAKE": {
      const competitorBrandId = (change.detail as { competitorBrandId?: string })
        .competitorBrandId;
      if (!competitorBrandId || current.brandMentioned) return false;
      const row = current.competitorMentions.find(
        (c) => c.competitorBrandId === competitorBrandId
      );
      return row?.mentioned === true;
    }
    default:
      return false;
  }
}

async function loadRunSnapshot(
  runId: string,
  competitorBrands: Array<{ id: string; brandName: string }>
): Promise<RunSnapshot | null> {
  const run = await prisma.citationRun.findUnique({
    where: { id: runId },
    include: {
      competitorMentions: {
        select: {
          competitorBrandId: true,
          mentioned: true,
          competitorBrand: { select: { brandName: true } },
        },
      },
    },
  });
  if (!run || run.error) return null;

  const mentionedById = new Map(
    run.competitorMentions.map((m) => [m.competitorBrandId, m])
  );

  return {
    id: run.id,
    model: run.model,
    brandMentioned: run.brandMentioned,
    sentiment: run.sentiment,
    competitorMentions: competitorBrands.map((c) => {
      const row = mentionedById.get(c.id);
      return {
        competitorBrandId: c.id,
        competitorBrandName: c.brandName,
        mentioned: row?.mentioned === true,
      };
    }),
  };
}

function alertSubject(type: AlertType, brandName: string): string {
  switch (type) {
    case "CITATION_LOST":
      return `Xoopa: ${brandName} citation lost`;
    case "CITATION_GAINED":
      return `Xoopa: ${brandName} citation gained`;
    case "COMPETITOR_OVERTAKE":
      return `Xoopa: competitor overtook ${brandName}`;
    case "SENTIMENT_FLIP":
      return `Xoopa: ${brandName} sentiment flipped negative`;
    default:
      return `Xoopa alert for ${brandName}`;
  }
}

function alertTextBody(
  type: AlertType,
  detail: Record<string, unknown>,
  unsubscribeUrl: string
): string {
  const prompt = String(detail.promptText ?? "");
  const model = String(detail.model ?? "");
  return [
    `Alert type: ${type}`,
    model ? `Model: ${model}` : null,
    prompt ? `Query: ${prompt}` : null,
    "",
    "Confirmed across 2 consecutive citation runs (single-run flips are ignored).",
    "",
    `Unsubscribe: ${unsubscribeUrl}`,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

function asJson(value: Record<string, unknown>): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

async function deliverCreatedAlert(params: {
  alertId: string;
  userId: string;
  userEmail: string | null;
  planTier: PlanTier;
  type: AlertType;
  detail: Record<string, unknown>;
  brandName: string;
  digestFrequency: AlertDigestFrequency;
  webhookUrl: string | null;
  webhookDisabledAt: Date | null;
  unsubscribeToken: string;
}) {
  const skips: string[] = [];
  const {
    alertId,
    userId,
    userEmail,
    planTier,
    type,
    detail,
    brandName,
    digestFrequency,
    webhookUrl,
    webhookDisabledAt,
    unsubscribeToken,
  } = params;

  if (digestFrequency === "OFF") {
    skips.push("DIGEST_OFF");
  } else if (digestFrequency === "WEEKLY") {
    skips.push("QUEUED_FOR_WEEKLY_DIGEST");
  } else if (!userEmail) {
    skips.push("NO_RECIPIENT");
  } else if (!isMailProviderConfigured()) {
    skips.push("NO_MAIL_PROVIDER");
  } else {
    const unsubscribeUrl = buildUnsubscribeUrl(unsubscribeToken);
    const mail = await sendAlertEmail({
      to: userEmail,
      subject: alertSubject(type, brandName),
      textBody: alertTextBody(type, detail, unsubscribeUrl),
      unsubscribeUrl,
    });
    if (!mail.sent) skips.push(mail.reason);
  }

  const webhooksAllowed = PLAN_LIMITS[planTier].alertWebhooks;
  if (webhooksAllowed && webhookUrl && !webhookDisabledAt) {
    const webhook = await deliverAlertWebhook({
      userId,
      planTier,
      webhookUrl,
      webhookDisabledAt,
      payload: {
        id: alertId,
        type,
        detail,
        createdAt: new Date().toISOString(),
      },
    });
    if (!webhook.delivered) {
      skips.push(`WEBHOOK_FAILED:${webhook.error}`);
    }
  } else if (webhookUrl && !webhooksAllowed) {
    skips.push("WEBHOOK_PLAN_GATED");
  }

  await prisma.alert.update({
    where: { id: alertId },
    data: {
      deliverySkippedReason: skips.length > 0 ? skips.join(",") : null,
      deliveredAt:
        digestFrequency === "IMMEDIATE" &&
        !skips.some((s) =>
          ["NO_MAIL_PROVIDER", "NO_RECIPIENT", "DIGEST_OFF"].includes(s)
        )
          ? new Date()
          : undefined,
    },
  });
}

/**
 * After a successful citation run: detect changes vs previous same-model run,
 * require the change to hold across ALERT_CONFIRMATION_RUNS consecutive runs,
 * then create Alert rows and optionally deliver.
 */
export async function processAlertsForRun(params: {
  userId: string;
  trackedQueryId: string;
  brandName: string;
  promptText: string;
  run: {
    id: string;
    model: CitationModel;
    runAt: Date;
    error: string | null;
  };
}): Promise<{ created: number; pending: number }> {
  const { userId, trackedQueryId, brandName, promptText, run } = params;
  if (run.error) return { created: 0, pending: 0 };

  const [user, competitorBrands] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { planTier: true, email: true },
    }),
    prisma.competitorBrand.findMany({
      where: { userId },
      select: { id: true, brandName: true },
      take: 20,
    }),
  ]);
  if (!user) return { created: 0, pending: 0 };

  const current = await loadRunSnapshot(run.id, competitorBrands);
  if (!current) return { created: 0, pending: 0 };

  const previousRow = await prisma.citationRun.findFirst({
    where: {
      trackedQueryId,
      model: run.model,
      id: { not: run.id },
      error: null,
    },
    orderBy: { runAt: "desc" },
    select: { id: true },
  });
  const previous = previousRow
    ? await loadRunSnapshot(previousRow.id, competitorBrands)
    : null;

  const prefs = await ensureAlertPreference(userId);
  const freshCandidates =
    previous != null
      ? detectRunChanges(previous, current, { brandName, promptText }).filter(
          (c) => isTypeEnabled(prefs, c.type)
        )
      : [];
  const freshByFingerprint = new Map(
    freshCandidates.map((c) => [c.fingerprint, c])
  );

  const existingPending = await prisma.alertPendingChange.findMany({
    where: {
      userId,
      trackedQueryId,
      model: run.model,
    },
  });

  let created = 0;
  let pending = 0;
  const handledFingerprints = new Set<string>();

  for (const row of existingPending) {
    handledFingerprints.add(row.fingerprint);
    if (row.lastRunId === run.id) {
      pending += 1;
      continue;
    }

    const holds =
      freshByFingerprint.has(row.fingerprint) ||
      changeStillHolds(
        { type: row.type, detail: row.detail as Record<string, unknown> },
        current
      );

    if (!holds || !isTypeEnabled(prefs, row.type)) {
      await prisma.alertPendingChange.delete({ where: { id: row.id } });
      continue;
    }

    const nextCount = row.consecutiveCount + 1;
    const detail =
      (freshByFingerprint.get(row.fingerprint)?.detail as
        | Record<string, unknown>
        | undefined) ?? (row.detail as Record<string, unknown>);

    if (nextCount < ALERT_CONFIRMATION_RUNS) {
      await prisma.alertPendingChange.update({
        where: { id: row.id },
        data: {
          consecutiveCount: nextCount,
          lastRunId: run.id,
          detail: asJson(detail),
        },
      });
      pending += 1;
      continue;
    }

    const recent = await prisma.alert.findFirst({
      where: {
        userId,
        trackedQueryId,
        type: row.type,
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { createdAt: "desc" },
    });
    const recentFp =
      recent &&
      typeof recent.detail === "object" &&
      recent.detail !== null &&
      "fingerprint" in recent.detail
        ? String((recent.detail as { fingerprint?: string }).fingerprint ?? "")
        : "";
    if (recentFp === row.fingerprint) {
      await prisma.alertPendingChange.delete({ where: { id: row.id } });
      continue;
    }

    const alert = await prisma.alert.create({
      data: {
        userId,
        trackedQueryId,
        type: row.type,
        detail: asJson({
          ...detail,
          fingerprint: row.fingerprint,
          confirmedRuns: nextCount,
        }),
      },
    });
    created += 1;
    await prisma.alertPendingChange.delete({ where: { id: row.id } });

    await deliverCreatedAlert({
      alertId: alert.id,
      userId,
      userEmail: user.email,
      planTier: user.planTier as PlanTier,
      type: row.type,
      detail,
      brandName,
      digestFrequency: prefs.digestFrequency,
      webhookUrl: prefs.webhookUrl,
      webhookDisabledAt: prefs.webhookDisabledAt,
      unsubscribeToken: prefs.unsubscribeToken,
    });
  }

  for (const candidate of freshCandidates) {
    if (handledFingerprints.has(candidate.fingerprint)) continue;

    await prisma.alertPendingChange.create({
      data: {
        userId,
        trackedQueryId,
        model: run.model,
        fingerprint: candidate.fingerprint,
        type: candidate.type,
        detail: asJson(candidate.detail),
        consecutiveCount: 1,
        lastRunId: run.id,
      },
    });
    pending += 1;
  }

  return { created, pending };
}

/** Monday digest cron — email skipped with explicit reason until a provider is wired. */
export async function processWeeklyAlertDigest(): Promise<{
  users: number;
  alerts: number;
  mailProviderConfigured: boolean;
}> {
  const mailOk = isMailProviderConfigured();
  const prefs = await prisma.alertPreference.findMany({
    where: { digestFrequency: "WEEKLY" },
    select: { userId: true, unsubscribeToken: true },
  });

  let alerts = 0;
  for (const p of prefs) {
    const undelivered = await prisma.alert.findMany({
      where: {
        userId: p.userId,
        deliveredAt: null,
        OR: [
          { deliverySkippedReason: { contains: "QUEUED_FOR_WEEKLY_DIGEST" } },
          { deliverySkippedReason: null },
        ],
      },
    });
    if (undelivered.length === 0) continue;
    alerts += undelivered.length;

    await prisma.alert.updateMany({
      where: { id: { in: undelivered.map((a) => a.id) } },
      data: {
        deliverySkippedReason: "NO_MAIL_PROVIDER,QUEUED_FOR_WEEKLY_DIGEST",
      },
    });
  }

  return { users: prefs.length, alerts, mailProviderConfigured: mailOk };
}
