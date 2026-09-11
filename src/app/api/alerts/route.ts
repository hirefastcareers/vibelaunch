import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ensureAlertPreference } from "@/lib/alerts/process-alerts";
import { validateAlertWebhookUrl } from "@/lib/alerts/webhook-url";
import { PLAN_LIMITS, BILLING_UPGRADE_PATH } from "@/lib/billing/plans";
import { resolvePlanTier } from "@/lib/billing/limits";

export const dynamic = "force-dynamic";

/** List alerts + preferences for the signed-in user. */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const unreadOnly = req.nextUrl.searchParams.get("unread") === "1";
  const pref = await ensureAlertPreference(session.user.id);
  const planTier = await resolvePlanTier(session.user.id);

  const alerts = await prisma.alert.findMany({
    where: {
      userId: session.user.id,
      ...(unreadOnly ? { readAt: null } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      trackedQuery: { select: { brandName: true, promptText: true } },
    },
  });

  const unreadCount = await prisma.alert.count({
    where: { userId: session.user.id, readAt: null },
  });

  return NextResponse.json({
    alerts: alerts.map((a) => ({
      id: a.id,
      type: a.type,
      detail: a.detail,
      createdAt: a.createdAt.toISOString(),
      readAt: a.readAt?.toISOString() ?? null,
      deliveredAt: a.deliveredAt?.toISOString() ?? null,
      deliverySkippedReason: a.deliverySkippedReason,
      brandName: a.trackedQuery?.brandName ?? null,
      promptText: a.trackedQuery?.promptText ?? null,
    })),
    unreadCount,
    preference: {
      citationLostEnabled: pref.citationLostEnabled,
      citationGainedEnabled: pref.citationGainedEnabled,
      competitorOvertakeEnabled: pref.competitorOvertakeEnabled,
      sentimentFlipEnabled: pref.sentimentFlipEnabled,
      digestFrequency: pref.digestFrequency,
      webhookUrl: pref.webhookUrl,
      webhookFailCount: pref.webhookFailCount,
      webhookLastError: pref.webhookLastError,
      webhookLastSuccessAt: pref.webhookLastSuccessAt?.toISOString() ?? null,
      webhookDisabledAt: pref.webhookDisabledAt?.toISOString() ?? null,
      unsubscribeToken: pref.unsubscribeToken,
    },
    plan: {
      tier: planTier,
      alertWebhooks: PLAN_LIMITS[planTier].alertWebhooks,
      upgradePath: BILLING_UPGRADE_PATH,
    },
    mailProviderConfigured: Boolean(
      process.env.RESEND_API_KEY?.trim() ||
        process.env.POSTMARK_SERVER_TOKEN?.trim() ||
        process.env.SENDGRID_API_KEY?.trim()
    ),
  });
}

/** Update alert preferences. */
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = z
    .object({
      citationLostEnabled: z.boolean().optional(),
      citationGainedEnabled: z.boolean().optional(),
      competitorOvertakeEnabled: z.boolean().optional(),
      sentimentFlipEnabled: z.boolean().optional(),
      digestFrequency: z.enum(["OFF", "WEEKLY", "IMMEDIATE"]).optional(),
      webhookUrl: z.string().nullable().optional(),
      clearWebhookCircuit: z.boolean().optional(),
    })
    .safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  await ensureAlertPreference(session.user.id);
  const planTier = await resolvePlanTier(session.user.id);
  const data: Record<string, unknown> = {};

  for (const key of [
    "citationLostEnabled",
    "citationGainedEnabled",
    "competitorOvertakeEnabled",
    "sentimentFlipEnabled",
    "digestFrequency",
  ] as const) {
    if (parsed.data[key] !== undefined) {
      data[key] = parsed.data[key];
    }
  }

  if (parsed.data.webhookUrl !== undefined) {
    if (!PLAN_LIMITS[planTier].alertWebhooks) {
      return NextResponse.json(
        {
          error: "Alert webhooks require Starter or Pro",
          code: "WEBHOOK_PLAN_GATE",
          upgradePath: BILLING_UPGRADE_PATH,
        },
        { status: 403 }
      );
    }
    if (parsed.data.webhookUrl === null || parsed.data.webhookUrl.trim() === "") {
      data.webhookUrl = null;
      data.webhookFailCount = 0;
      data.webhookLastError = null;
      data.webhookDisabledAt = null;
    } else {
      const validated = validateAlertWebhookUrl(parsed.data.webhookUrl);
      if (!validated.ok) {
        return NextResponse.json({ error: validated.error }, { status: 400 });
      }
      data.webhookUrl = validated.url;
      data.webhookFailCount = 0;
      data.webhookLastError = null;
      data.webhookDisabledAt = null;
    }
  }

  if (parsed.data.clearWebhookCircuit) {
    data.webhookFailCount = 0;
    data.webhookLastError = null;
    data.webhookDisabledAt = null;
  }

  const pref = await prisma.alertPreference.update({
    where: { userId: session.user.id },
    data,
  });

  return NextResponse.json({
    preference: {
      citationLostEnabled: pref.citationLostEnabled,
      citationGainedEnabled: pref.citationGainedEnabled,
      competitorOvertakeEnabled: pref.competitorOvertakeEnabled,
      sentimentFlipEnabled: pref.sentimentFlipEnabled,
      digestFrequency: pref.digestFrequency,
      webhookUrl: pref.webhookUrl,
      webhookFailCount: pref.webhookFailCount,
      webhookLastError: pref.webhookLastError,
      webhookLastSuccessAt: pref.webhookLastSuccessAt?.toISOString() ?? null,
      webhookDisabledAt: pref.webhookDisabledAt?.toISOString() ?? null,
    },
  });
}
