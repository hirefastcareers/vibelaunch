import type { PlanTier } from "@/lib/billing/plans";
import { PLAN_DISPLAY, PLAN_LIMITS } from "@/lib/billing/plans";
import type { UsageSnapshot } from "@/lib/billing/limits";
import Link from "next/link";
import { CheckoutButton } from "@/components/checkout-button";

const TIERS: PlanTier[] = ["FREE", "STARTER", "PRO"];

function statusNote(status: string | null | undefined): string | null {
  if (!status || status === "active") return null;
  if (status === "cancelled") {
    return "Cancellation is scheduled — access continues until the current period ends.";
  }
  if (status === "failed") {
    return "The last payment failed. Update your payment method to keep the plan.";
  }
  if (status === "on_hold") {
    return "Subscription is on hold.";
  }
  if (status === "expired") {
    return "Subscription has expired.";
  }
  return `Status: ${status}`;
}

interface BillingContentProps {
  planTier: PlanTier;
  subscriptionStatus: string | null;
  planRenewsAt: string | null;
  usage: Pick<UsageSnapshot, "projectCount" | "postCount" | "projectLimit" | "postLimit">;
  starterCheckoutHref: string | null;
  proCheckoutHref: string | null;
  portalHref: string | null;
}

export default function BillingContent({
  planTier,
  subscriptionStatus,
  planRenewsAt,
  usage,
  starterCheckoutHref,
  proCheckoutHref,
  portalHref,
}: BillingContentProps) {
  const current = PLAN_DISPLAY[planTier];
  const note = statusNote(subscriptionStatus);
  const showStarterUpgrade = planTier === "FREE" && starterCheckoutHref;
  const showProUpgrade = planTier !== "PRO" && proCheckoutHref;

  return (
    <div className="p-6 max-w-5xl space-y-10">
      <div>
        <p className="font-mono text-[10px] tracking-widest text-muted-foreground mb-1">
          BILLING
        </p>
        <h1 className="text-4xl">Billing</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Project and monthly post limits. Everything else stays available on every plan.
        </p>
      </div>

      <section>
        <p className="font-mono text-[10px] tracking-widest text-muted-foreground mb-3">
          01 — CURRENT PLAN
        </p>
        <div className="border border-border divide-y divide-border">
          <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] bg-background">
            <div className="px-5 py-4 font-mono text-[11px] tracking-wider text-muted-foreground border-b border-border lg:border-b-0 lg:border-r">
              PLAN
            </div>
            <div className="px-5 py-4">
              <span className="font-serif text-[21px]">{current.label}</span>
              <span className="ml-3 font-mono text-[11px] text-muted-foreground">
                {current.price}
              </span>
            </div>
          </div>
          {note && (
            <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] bg-card">
              <div className="px-5 py-4 font-mono text-[11px] tracking-wider text-muted-foreground border-b border-border lg:border-b-0 lg:border-r">
                STATUS
              </div>
              <div className="px-5 py-4 text-sm text-muted-foreground">{note}</div>
            </div>
          )}
          {planRenewsAt && (
            <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr]">
              <div className="px-5 py-4 font-mono text-[11px] tracking-wider text-muted-foreground border-b border-border lg:border-b-0 lg:border-r">
                RENEWS
              </div>
              <div className="px-5 py-4 font-mono text-[12px] text-muted-foreground">
                {new Date(planRenewsAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </div>
          )}
        </div>
        {portalHref && (
          <p className="mt-3">
            <Link
              href={portalHref}
              className="font-mono text-[11px] tracking-wider text-muted-foreground border-b border-border hover:text-foreground"
            >
              MANAGE SUBSCRIPTION
            </Link>
          </p>
        )}
      </section>

      <section>
        <p className="font-mono text-[10px] tracking-widest text-muted-foreground mb-3">
          02 — USAGE THIS MONTH
        </p>
        <div className="grid gap-px bg-border md:grid-cols-2 border border-border">
          <div className="bg-background px-5 py-[22px]">
            <p className="font-mono text-[10px] tracking-widest text-muted-foreground">
              POSTS
            </p>
            <p className="font-serif text-[32px] tracking-[-0.02em] mt-2">
              {usage.postCount}{" "}
              <span className="text-[18px] text-muted-foreground">of {usage.postLimit}</span>
            </p>
          </div>
          <div className="bg-card px-5 py-[22px]">
            <p className="font-mono text-[10px] tracking-widest text-muted-foreground">
              PROJECTS
            </p>
            <p className="font-serif text-[32px] tracking-[-0.02em] mt-2">
              {usage.projectCount}{" "}
              <span className="text-[18px] text-muted-foreground">of {usage.projectLimit}</span>
            </p>
          </div>
        </div>
      </section>

      <section>
        <p className="font-mono text-[10px] tracking-widest text-muted-foreground mb-3">
          03 — PLANS
        </p>
        <div className="border border-ink bg-background">
          <div className="hidden lg:grid grid-cols-[1.2fr_1fr_1fr_140px] gap-px bg-ink">
            <div className="bg-ink px-5 py-3.5 font-mono text-[10px] tracking-[0.14em] text-[#8C857A]">
              PLAN
            </div>
            <div className="bg-ink px-5 py-3.5 font-mono text-[10px] tracking-[0.14em] text-[#8C857A]">
              PROJECTS
            </div>
            <div className="bg-ink px-5 py-3.5 font-mono text-[10px] tracking-[0.14em] text-[#8C857A]">
              POSTS / MONTH
            </div>
            <div className="bg-ink px-5 py-3.5 font-mono text-[10px] tracking-[0.14em] text-[#8C857A]">
              PRICE
            </div>
          </div>
          {TIERS.map((tier) => {
            const display = PLAN_DISPLAY[tier];
            const limits = PLAN_LIMITS[tier];
            const isCurrent = tier === planTier;
            return (
              <div
                key={tier}
                className="grid grid-cols-1 border-b border-border last:border-b-0 lg:grid-cols-[1.2fr_1fr_1fr_140px]"
              >
                <div className="px-5 py-[18px] font-serif text-[21px] tracking-[-0.01em] lg:border-r border-border">
                  {display.label}
                  {isCurrent && (
                    <span className="ml-2 font-mono text-[10px] tracking-wider text-muted-foreground">
                      CURRENT
                    </span>
                  )}
                </div>
                <div className="px-5 py-[18px] font-mono text-[12px] text-muted-foreground lg:border-r border-border">
                  {limits.projects}
                </div>
                <div className="px-5 py-[18px] font-mono text-[12px] text-muted-foreground lg:border-r border-border">
                  {limits.postsPerMonth}
                </div>
                <div className="px-5 py-[18px] font-mono text-[12px]">
                  {display.price}
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-3 font-mono text-[11px] text-muted-foreground">
          Billed in your local currency at checkout.
        </p>

        {(showStarterUpgrade || showProUpgrade) && (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {showStarterUpgrade && starterCheckoutHref && (
              <CheckoutButton href={starterCheckoutHref}>
                UPGRADE TO STARTER
              </CheckoutButton>
            )}
            {showProUpgrade && proCheckoutHref && (
              <CheckoutButton href={proCheckoutHref} primary={!showStarterUpgrade}>
                UPGRADE TO PRO
              </CheckoutButton>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
