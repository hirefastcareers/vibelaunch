import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { getSession } from "@/lib/session";
import { MarketingSiteNav } from "@/components/marketing/site-nav";
import { MarketingSiteFooter } from "@/components/marketing/site-footer";
import { JsonLd } from "@/components/marketing/json-ld";
import { marketingPlanRows } from "@/lib/marketing/plan-copy";
import {
  PRICING_DESCRIPTION,
  PRICING_FAQS,
  PRICING_TITLE,
  faqPageJsonLd,
  organizationJsonLd,
  softwareApplicationJsonLd,
} from "@/lib/marketing/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: PRICING_TITLE,
  description: PRICING_DESCRIPTION,
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: PRICING_TITLE,
    description: PRICING_DESCRIPTION,
    url: "/pricing",
    siteName: "Xoopa",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: PRICING_TITLE,
    description: PRICING_DESCRIPTION,
  },
};

const COMPARISON_ROWS: {
  label: string;
  values: (row: ReturnType<typeof marketingPlanRows>[number]) => string;
}[] = [
  { label: "Tracked prompts", values: (r) => String(r.trackedQueries) },
  { label: "Models", values: (r) => `${r.modelCount}: ${r.models}` },
  { label: "Run frequency", values: (r) => r.runsPerWeek },
  { label: "Competitors", values: (r) => String(r.competitors) },
  { label: "Content suggestions", values: (r) => r.suggestions },
];

export default async function PricingPage() {
  const session = await getSession();
  const signedIn = Boolean(session);
  const ctaHref = signedIn ? "/dashboard" : "/auth/signin";
  const ctaLabel = signedIn ? "Go to dashboard" : "Get Started Free";
  const navCta = signedIn ? "Dashboard" : "Get Started Free";
  const userLabel = session?.user.xUsername
    ? `@${session.user.xUsername}`
    : session?.user.name;
  const plans = marketingPlanRows();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <JsonLd
        data={[organizationJsonLd(), softwareApplicationJsonLd(), faqPageJsonLd(PRICING_FAQS)]}
      />
      <MarketingSiteNav signedIn={signedIn} ctaLabel={navCta} userLabel={userLabel} />

      <section className="relative overflow-hidden border-b border-border">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(16_100%_50%_/_0.07),_transparent_50%),linear-gradient(to_bottom,_hsl(var(--muted)_/_0.3),_transparent_45%)]"
        />
        <div className="ds-container relative pb-14 pt-16 md:pb-20 md:pt-20">
          <p className="ds-kicker">Pricing</p>
          <h1 className="mt-3 max-w-2xl text-[36px] leading-[1.1] tracking-[-0.03em] md:text-[48px]">
            Plans that match the citation limits we actually enforce
          </h1>
          <p className="mt-5 max-w-[52ch] text-base text-muted-foreground md:text-lg">
            Numbers below come from the product plan config: the same caps the dashboard and cron
            use.{" "}
            <Link href="/" className="text-foreground underline underline-offset-4">
              Back to home
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="ds-section border-b border-border" aria-labelledby="tiers-heading">
        <div className="ds-container">
          <h2 id="tiers-heading" className="sr-only">
            Plan tiers
          </h2>
          <div className="grid gap-4 lg:grid-cols-3">
            {plans.map((plan) => (
              <article
                key={plan.tier}
                className={
                  plan.featured
                    ? "rounded-xl border-2 border-primary bg-card p-6 shadow-sm"
                    : "rounded-xl border border-border bg-card p-6"
                }
              >
                {plan.featured ? (
                  <p className="ds-kicker mb-3">Most popular</p>
                ) : (
                  <p className="ds-label mb-3">&nbsp;</p>
                )}
                <h3 className="text-xl font-medium tracking-tight">{plan.label}</h3>
                <p className="mt-3 flex items-baseline gap-1">
                  <span className="font-serif text-4xl tracking-tight">{plan.priceAmount}</span>
                  {plan.pricePeriod ? (
                    <span className="text-sm text-muted-foreground">{plan.pricePeriod}</span>
                  ) : null}
                </p>
                <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                    {plan.trackedQueries} tracked prompts
                  </li>
                  <li className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                    {plan.modelCount} models ({plan.models})
                  </li>
                  <li className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                    {plan.runsPerWeek}
                  </li>
                  <li className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                    {plan.competitors} competitor{plan.competitors === 1 ? "" : "s"}
                  </li>
                  <li className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                    {plan.suggestions} content suggestions
                  </li>
                </ul>
                <Link
                  href={ctaHref}
                  className={
                    plan.featured
                      ? "ds-btn mt-8 w-full text-center"
                      : "ds-btn-secondary mt-8 w-full text-center"
                  }
                >
                  {ctaLabel}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ds-section border-b border-border" aria-labelledby="compare-heading">
        <div className="ds-container">
          <h2 id="compare-heading" className="text-2xl tracking-tight md:text-3xl">
            Compare limits
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Prompts, models, run frequency, competitors, and content suggestions per tier.
          </p>
          <div className="mt-8 overflow-x-auto rounded-xl border border-border">
            <table className="ds-table min-w-[640px]">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left">
                  <th scope="col" className="px-4 py-3 font-medium">
                    Limit
                  </th>
                  {plans.map((plan) => (
                    <th key={plan.tier} scope="col" className="px-4 py-3 font-medium">
                      {plan.label}
                      <span className="mt-1 block text-xs font-normal text-muted-foreground">
                        {plan.price}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.label} className="border-b border-border last:border-0">
                    <th scope="row" className="px-4 py-3 text-left font-medium">
                      {row.label}
                    </th>
                    {plans.map((plan) => (
                      <td key={plan.tier} className="px-4 py-3 text-muted-foreground">
                        {row.values(plan)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="ds-section border-b border-border" aria-labelledby="faq-heading">
        <div className="ds-container max-w-3xl">
          <h2 id="faq-heading" className="text-2xl tracking-tight md:text-3xl">
            FAQ
          </h2>
          <dl className="mt-10 space-y-8">
            {PRICING_FAQS.map((faq) => (
              <div key={faq.question}>
                <dt>
                  <h3 className="text-lg font-medium tracking-tight">{faq.question}</h3>
                </dt>
                <dd className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">
                  {faq.answer}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="ds-section" aria-labelledby="pricing-cta-heading">
        <div className="ds-container text-center">
          <h2 id="pricing-cta-heading" className="text-2xl tracking-tight md:text-3xl">
            Start on Free
          </h2>
          <p className="mx-auto mt-3 max-w-[44ch] text-muted-foreground">
            Upgrade from the dashboard when you need more prompts or all five models.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href={ctaHref} className="ds-btn px-8 py-4 text-sm">
              {ctaLabel}
            </Link>
            <Link href="/" className="ds-btn-secondary px-8 py-4 text-sm">
              Learn more on the home page
            </Link>
          </div>
        </div>
      </section>

      <MarketingSiteFooter />
    </main>
  );
}
