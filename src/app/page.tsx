import type { Metadata } from "next";
import Link from "next/link";
import {
  BarChart3,
  MessageSquareQuote,
  Radar,
  Scale,
} from "lucide-react";
import { getSession } from "@/lib/session";
import { IconFeatureCard } from "@/components/ui/icon-feature-card";
import { MarketingSiteNav } from "@/components/marketing/site-nav";
import { MarketingSiteFooter } from "@/components/marketing/site-footer";
import { FixItShowcase } from "@/components/marketing/fix-it-showcase";
import { JsonLd } from "@/components/marketing/json-ld";
import {
  HOME_DESCRIPTION,
  HOME_TITLE,
  organizationJsonLd,
  softwareApplicationJsonLd,
} from "@/lib/marketing/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    url: "/",
    siteName: "Xoopa",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
  },
};

const FEATURES = [
  {
    icon: Radar,
    label: "Citation tracking across 5 models",
    description:
      "Sweep your prompts on ChatGPT, Claude, Gemini, Perplexity, and Grok. See who mentions you and who doesn’t, with real run history, not simulated scores.",
  },
  {
    icon: Scale,
    label: "Competitor comparison & share of voice",
    description:
      "Add competitors and compare mention rates side by side. Share-of-voice is computed from your actual citation runs.",
  },
  {
    icon: MessageSquareQuote,
    label: "Sentiment breakdown",
    description:
      "When you’re mentioned, classify tone as positive, neutral, or negative. Failures stay null. We never invent a neutral sentiment.",
  },
] as const;

export default async function HomePage() {
  const session = await getSession();
  const signedIn = Boolean(session);
  const ctaHref = signedIn ? "/dashboard" : "/auth/signin";
  const ctaLabel = signedIn ? "Go to dashboard" : "Get Started Free";
  const navCta = signedIn ? "Dashboard" : "Get Started Free";
  const userLabel = session?.user.xUsername
    ? `@${session.user.xUsername}`
    : session?.user.name;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <JsonLd data={[organizationJsonLd(), softwareApplicationJsonLd()]} />
      <MarketingSiteNav signedIn={signedIn} ctaLabel={navCta} userLabel={userLabel} />

      {/* Hero: one composition (brand, headline, support, CTA) */}
      <section className="relative overflow-hidden border-b border-border">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(16_100%_50%_/_0.08),_transparent_55%),linear-gradient(to_bottom,_hsl(var(--muted)_/_0.35),_transparent_50%)]"
        />
        <div className="ds-container relative pb-20 pt-16 md:pb-28 md:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-5 font-serif text-4xl tracking-[-0.03em] text-foreground md:text-5xl">
              Xoopa
            </p>
            <h1 className="text-[32px] leading-[1.12] tracking-[-0.03em] text-foreground md:text-[48px] md:leading-[1.08]">
              AI citation tracking that closes the loop with content fixes, not just scorekeeping.
            </h1>
            <p className="mx-auto mt-6 max-w-[52ch] text-base leading-relaxed text-muted-foreground md:text-lg">
              Built for indie hackers and SaaS builders who need to know if ChatGPT, Claude, Gemini,
              Perplexity, or Grok recommend their product, and what to publish when they don’t.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href={ctaHref} className="ds-btn px-8 py-4 text-sm">
                {ctaLabel}
              </Link>
              <Link href="/pricing" className="ds-btn-secondary px-8 py-4 text-sm">
                View pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="ds-section border-b border-border" aria-labelledby="features-heading">
        <div className="ds-container">
          <div className="mx-auto max-w-2xl text-center">
            <p className="ds-kicker">Features</p>
            <h2 id="features-heading" className="mt-3 text-3xl tracking-tight md:text-4xl">
              Visibility across the assistants your buyers use
            </h2>
            <p className="mt-4 text-muted-foreground">
              Track mentions, compare competitors, and read sentiment from live model responses.
            </p>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {FEATURES.map((feature) => (
              <IconFeatureCard
                key={feature.label}
                icon={feature.icon}
                label={feature.label}
                description={feature.description}
              />
            ))}
          </div>
        </div>
      </section>

      <section id="fix-it" className="ds-section border-b border-border" aria-labelledby="fix-it-heading">
        <div className="ds-container">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <p className="ds-kicker">Content loop</p>
            <h2 id="fix-it-heading" className="mt-3 text-3xl tracking-tight md:text-4xl">
              From gap to brief to the next sweep
            </h2>
            <p className="mt-4 text-muted-foreground">
              Most GEO tools stop at the chart. Xoopa turns misses into citeable content work.
            </p>
          </div>
          <FixItShowcase />
        </div>
      </section>

      <section
        id="social-proof"
        className="ds-section border-b border-border"
        aria-labelledby="social-proof-heading"
      >
        <div className="ds-container">
          <div className="mx-auto max-w-2xl text-center">
            <p className="ds-kicker">Social proof</p>
            <h2 id="social-proof-heading" className="mt-3 text-3xl tracking-tight md:text-4xl">
              Real users and real quotes, when we have them
            </h2>
            <p className="mt-4 text-muted-foreground">
              We don’t invent testimonials or user counts. This section stays empty until founders
              using Xoopa are ready to be named.
            </p>
          </div>
          <div className="mx-auto mt-10 max-w-xl rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center">
            <BarChart3 className="mx-auto h-5 w-5 text-muted-foreground" strokeWidth={1.5} aria-hidden />
            <p className="mt-4 text-sm font-medium text-foreground">Placeholder for Tom</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Drop in quotes, logos, or case notes here once early customers exist. Until then this
              page stays honest.
            </p>
          </div>
        </div>
      </section>

      <section className="ds-section border-b border-border" aria-labelledby="cta-heading">
        <div className="ds-container text-center">
          <h2 id="cta-heading" className="text-3xl tracking-tight md:text-4xl">
            Start tracking citations for free
          </h2>
          <p className="mx-auto mt-4 max-w-[48ch] text-muted-foreground">
            Free tier included. See{" "}
            <Link href="/pricing" className="text-foreground underline underline-offset-4">
              pricing
            </Link>{" "}
            for Starter and Pro limits, pulled from the same plan config the product enforces.
          </p>
          <Link href={ctaHref} className="ds-btn mt-8 px-8 py-4 text-sm">
            {ctaLabel}
          </Link>
        </div>
      </section>

      <MarketingSiteFooter />
    </main>
  );
}
