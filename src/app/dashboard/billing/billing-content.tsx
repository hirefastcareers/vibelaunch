import type { PlanTier } from "@/lib/billing/plans";
import { PLAN_DISPLAY, PLAN_LIMITS } from "@/lib/billing/plans";
import type { UsageSnapshot } from "@/lib/billing/limits";
import Link from "next/link";
import { CheckoutButton } from "@/components/checkout-button";
import { StatusPill } from "@/components/status-pill";
import { DashboardPage, PageHeader } from "@/components/dashboard-page";

const TIERS: PlanTier[] = ["FREE", "STARTER", "PRO"];

function statusNote(status: string | null | undefined): string | null {
  if (!status || status === "active") return null;
  if (status === "cancelled") {
    return "Cancellation is scheduled. Access continues until the current period ends.";
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
  const postUsagePct = Math.min(100, Math.round((usage.postCount / Math.max(1, usage.postLimit)) * 100));
  const projectUsagePct = Math.min(
    100,
    Math.round((usage.projectCount / Math.max(1, usage.projectLimit)) * 100)
  );

  return (
    <DashboardPage>
      <PageHeader
        title="Billing"
        description="Project and monthly post limits. Everything else stays available on every plan."
        actions={
          <StatusPill tone={subscriptionStatus === "active" || !subscriptionStatus ? "ok" : "warn"}>
            {subscriptionStatus
              ? subscriptionStatus.replaceAll("_", " ")
              : "Free plan"}
          </StatusPill>
        }
      />

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card px-5 py-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Posts this month</p>
          <div className="mt-2 flex items-end justify-between gap-4">
            <p className="text-[32px] font-medium tracking-tight">
              {usage.postCount}
              <span className="ml-2 text-[18px] text-muted-foreground">of {usage.postLimit}</span>
            </p>
            <p className="text-xs text-muted-foreground">{postUsagePct}% used</p>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary" style={{ width: `${postUsagePct}%` }} />
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card px-5 py-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Projects</p>
          <div className="mt-2 flex items-end justify-between gap-4">
            <p className="text-[32px] font-medium tracking-tight">
              {usage.projectCount}
              <span className="ml-2 text-[18px] text-muted-foreground">of {usage.projectLimit}</span>
            </p>
            <p className="text-xs text-muted-foreground">{projectUsagePct}% used</p>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-ink" style={{ width: `${projectUsagePct}%` }} />
          </div>
        </div>
      </section>

      <section>
        <p className="mb-3 text-sm font-medium text-foreground">Current plan</p>
        <div className="overflow-hidden rounded-xl border border-border divide-y divide-border bg-background">
          <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] bg-background">
            <div className="px-5 py-4 text-sm text-muted-foreground border-b border-border lg:border-b-0 lg:border-r">
              Plan
            </div>
            <div className="px-5 py-4">
              <span className="text-lg font-medium">{current.label}</span>
              <span className="ml-3 text-sm text-muted-foreground">
                {current.price}
              </span>
            </div>
          </div>
          {note && (
            <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] bg-card">
              <div className="px-5 py-4 text-sm text-muted-foreground border-b border-border lg:border-b-0 lg:border-r">
                Status
              </div>
              <div className="px-5 py-4 text-sm text-muted-foreground">{note}</div>
            </div>
          )}
          {planRenewsAt && (
            <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr]">
              <div className="px-5 py-4 text-sm text-muted-foreground border-b border-border lg:border-b-0 lg:border-r">
                Renews
              </div>
              <div className="px-5 py-4 text-sm text-muted-foreground">
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
              className="text-sm font-medium text-primary hover:underline"
            >
              Manage subscription
            </Link>
          </p>
        )}
      </section>

      <section>
        <p className="mb-3 text-sm font-medium text-foreground">Plans</p>
        <div className="border border-ink bg-background">
          <div className="hidden lg:grid grid-cols-[1.2fr_1fr_1fr_140px] gap-px bg-ink">
            <div className="bg-ink px-5 py-3.5 text-xs font-medium text-[#8C857A]">
              Plan
            </div>
            <div className="bg-ink px-5 py-3.5 text-xs font-medium text-[#8C857A]">
              Projects
            </div>
            <div className="bg-ink px-5 py-3.5 text-xs font-medium text-[#8C857A]">
              Posts / month
            </div>
            <div className="bg-ink px-5 py-3.5 text-xs font-medium text-[#8C857A]">
              Price
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
                <div className="px-5 py-[18px] text-lg font-medium tracking-tight lg:border-r border-border">
                  {display.label}
                  {isCurrent && (
                    <span className="ml-2 text-xs font-medium text-muted-foreground">
                      Current
                    </span>
                  )}
                </div>
                <div className="px-5 py-[18px] text-sm text-muted-foreground lg:border-r border-border">
                  {limits.projects}
                </div>
                <div className="px-5 py-[18px] text-sm text-muted-foreground lg:border-r border-border">
                  {limits.postsPerMonth}
                </div>
                <div className="px-5 py-[18px] text-sm">
                  {display.price}
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Billed in your local currency at checkout.
        </p>

        {(showStarterUpgrade || showProUpgrade) && (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {showStarterUpgrade && starterCheckoutHref && (
              <CheckoutButton href={starterCheckoutHref}>
                Upgrade to Starter
              </CheckoutButton>
            )}
            {showProUpgrade && proCheckoutHref && (
              <CheckoutButton href={proCheckoutHref} primary={!showStarterUpgrade}>
                Upgrade to Pro
              </CheckoutButton>
            )}
          </div>
        )}
      </section>
    </DashboardPage>
  );
}
