import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS, type PlanTier } from "@/lib/billing/plans";
import { assertWebhookDnsSafe } from "@/lib/alerts/webhook-url";

const WEBHOOK_FAILURE_CIRCUIT = 5;
const WEBHOOK_TIMEOUT_MS = 8_000;

export type WebhookDeliveryResult =
  | { delivered: true }
  | { delivered: false; error: string; circuitOpen?: boolean };

/**
 * POST alert JSON to the user's webhook with basic retry (2 attempts).
 * Opens a circuit after WEBHOOK_FAILURE_CIRCUIT consecutive failures.
 */
export async function deliverAlertWebhook(opts: {
  userId: string;
  planTier: PlanTier;
  webhookUrl: string | null | undefined;
  webhookDisabledAt: Date | null | undefined;
  payload: Record<string, unknown>;
}): Promise<WebhookDeliveryResult> {
  if (!PLAN_LIMITS[opts.planTier].alertWebhooks) {
    return { delivered: false, error: "Webhooks require Starter or Pro" };
  }
  if (!opts.webhookUrl || opts.webhookDisabledAt) {
    return {
      delivered: false,
      error: opts.webhookDisabledAt
        ? "Webhook disabled after repeated failures"
        : "No webhook URL configured",
    };
  }

  // Re-resolve DNS at send time (not only at save) to block rebinding to private IPs.
  const validated = await assertWebhookDnsSafe(opts.webhookUrl);
  if (!validated.ok) {
    return { delivered: false, error: validated.error };
  }

  let lastError = "Webhook delivery failed";
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      // Re-check DNS each attempt in case TTL flipped mid-retry.
      const live = await assertWebhookDnsSafe(opts.webhookUrl);
      if (!live.ok) {
        lastError = live.error;
        break;
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);
      const res = await fetch(live.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "XoopaAlertWebhook/1.0",
        },
        body: JSON.stringify(opts.payload),
        signal: controller.signal,
        redirect: "error",
      });
      clearTimeout(timer);

      if (res.ok) {
        await prisma.alertPreference.update({
          where: { userId: opts.userId },
          data: {
            webhookFailCount: 0,
            webhookLastError: null,
            webhookLastSuccessAt: new Date(),
            webhookDisabledAt: null,
          },
        });
        return { delivered: true };
      }
      lastError = `HTTP ${res.status}`;
    } catch (err) {
      lastError = err instanceof Error ? err.message : "fetch failed";
    }
  }

  const pref = await prisma.alertPreference.update({
    where: { userId: opts.userId },
    data: {
      webhookFailCount: { increment: 1 },
      webhookLastError: lastError.slice(0, 500),
    },
  });

  if (pref.webhookFailCount >= WEBHOOK_FAILURE_CIRCUIT) {
    await prisma.alertPreference.update({
      where: { userId: opts.userId },
      data: { webhookDisabledAt: new Date() },
    });
    return { delivered: false, error: lastError, circuitOpen: true };
  }

  return { delivered: false, error: lastError };
}
