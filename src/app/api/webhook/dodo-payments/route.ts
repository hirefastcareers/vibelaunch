import { Webhooks } from "@dodopayments/nextjs";
import type { Subscription } from "@dodopayments/core";
import { prisma } from "@/lib/prisma";
import type { PlanTier, Prisma } from "@prisma/client";

type SubscriptionEvent = {
  type: string;
  data: Subscription;
};

function planTierFromProductId(productId: string | undefined): PlanTier | null {
  if (!productId) return null;
  const starterId = process.env.DODO_STARTER_PRODUCT_ID;
  const proId = process.env.DODO_PRO_PRODUCT_ID;
  // Empty placeholders in env must not match an empty product_id.
  if (starterId && productId === starterId) return "STARTER";
  if (proId && productId === proId) return "PRO";
  return null;
}

function userIdFromMetadata(
  metadata: Record<string, unknown> | undefined,
): string | undefined {
  const value = metadata?.userId;
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function requiredSubscriptionFields(data: Subscription): boolean {
  return Boolean(
    data.customer?.customer_id && data.subscription_id && data.product_id,
  );
}

async function findUserForSubscription(data: Subscription) {
  const userId = userIdFromMetadata(data.metadata);
  if (userId) {
    const byId = await prisma.user.findUnique({ where: { id: userId } });
    if (byId) return byId;
  }

  const customerId = data.customer?.customer_id;
  if (customerId) {
    const byCustomer = await prisma.user.findUnique({
      where: { dodoCustomerId: customerId },
    });
    if (byCustomer) return byCustomer;
  }

  if (data.subscription_id) {
    const bySubscription = await prisma.user.findFirst({
      where: { dodoSubscriptionId: data.subscription_id },
    });
    if (bySubscription) return bySubscription;
  }

  return null;
}

async function updateUserFromSubscription(
  payload: SubscriptionEvent,
  fields: Prisma.UserUpdateInput,
) {
  const { data } = payload;
  if (!requiredSubscriptionFields(data) && !userIdFromMetadata(data.metadata)) {
    console.error(
      "[dodo-webhook] missing expected subscription fields",
      payload,
    );
    return;
  }

  const user = await findUserForSubscription(data);
  if (!user) {
    console.error(
      "[dodo-webhook] could not match User (need metadata.userId from metadata_userId, dodoCustomerId, or dodoSubscriptionId)",
      payload,
    );
    return;
  }

  await prisma.user.update({ where: { id: user.id }, data: fields });
}

export const POST = Webhooks({
  webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY ?? "",

  onSubscriptionActive: async (payload) => {
    const { data } = payload;
    const planTier = planTierFromProductId(data.product_id);
    if (!planTier) {
      console.error(
        "[dodo-webhook] unknown product_id on subscription.active",
        payload,
      );
    }

    await updateUserFromSubscription(payload, {
      ...(planTier ? { planTier } : {}),
      dodoCustomerId: data.customer.customer_id,
      dodoSubscriptionId: data.subscription_id,
      subscriptionStatus: "active",
      planRenewsAt: data.next_billing_date,
    });
  },

  onSubscriptionRenewed: async (payload) => {
    await updateUserFromSubscription(payload, {
      subscriptionStatus: payload.data.status ?? "active",
      planRenewsAt: payload.data.next_billing_date,
    });
  },

  onSubscriptionPlanChanged: async (payload) => {
    const planTier = planTierFromProductId(payload.data.product_id);
    if (!planTier) {
      console.error(
        "[dodo-webhook] unknown product_id on subscription.plan_changed",
        payload,
      );
    }

    await updateUserFromSubscription(payload, {
      ...(planTier ? { planTier } : {}),
      dodoSubscriptionId: payload.data.subscription_id,
      subscriptionStatus: payload.data.status,
      planRenewsAt: payload.data.next_billing_date,
    });
  },

  onSubscriptionCancelled: async (payload) => {
    // Do not downgrade planTier here — access continues until period end.
    await updateUserFromSubscription(payload, {
      subscriptionStatus: "cancelled",
    });
  },

  onSubscriptionExpired: async (payload) => {
    await updateUserFromSubscription(payload, {
      planTier: "FREE",
      subscriptionStatus: "expired",
    });
  },

  onSubscriptionFailed: async (payload) => {
    // Payment failure signal only — leave planTier as-is (grace period).
    await updateUserFromSubscription(payload, {
      subscriptionStatus: "failed",
    });
  },

  onSubscriptionOnHold: async (payload) => {
    await updateUserFromSubscription(payload, {
      subscriptionStatus: "on_hold",
    });
  },

  onPayload: async (payload) => {
    console.info("[dodo-webhook]", payload.type);
  },
});
