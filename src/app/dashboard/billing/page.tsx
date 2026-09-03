export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getUsage } from "@/lib/billing/limits";
import { productIdForTier } from "@/lib/billing/plans";
import BillingContent from "./billing-content";

function checkoutHref(
  productId: string | null,
  email: string | null | undefined,
  userId: string,
): string | null {
  if (!productId) return null;
  const params = new URLSearchParams({
    productId,
    metadata_userId: userId,
  });
  if (email) params.set("email", email);
  return `/checkout?${params.toString()}`;
}

export default async function BillingPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/auth/signin");

  const starterId = productIdForTier("STARTER");
  const proId = productIdForTier("PRO");
  const starterCheckoutHref = checkoutHref(
    starterId,
    session.user.email,
    session.user.id,
  );
  const proCheckoutHref = checkoutHref(proId, session.user.email, session.user.id);

  const [user, usage] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        planTier: true,
        subscriptionStatus: true,
        dodoCustomerId: true,
        planRenewsAt: true,
      },
    }),
    getUsage(session.user.id),
  ]);

  const portalHref = user?.dodoCustomerId
    ? `/customer-portal?customer_id=${encodeURIComponent(user.dodoCustomerId)}`
    : null;

  return (
    <BillingContent
      planTier={user?.planTier ?? usage.planTier}
      subscriptionStatus={user?.subscriptionStatus ?? null}
      planRenewsAt={user?.planRenewsAt?.toISOString() ?? null}
      usage={usage}
      starterCheckoutHref={starterCheckoutHref}
      proCheckoutHref={proCheckoutHref}
      portalHref={portalHref}
    />
  );
}
