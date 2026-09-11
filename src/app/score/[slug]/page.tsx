import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatCard } from "@/components/dashboard/stat-card";
import { DataPill } from "@/components/ui/data-pill";
import { getBaseUrl } from "@/lib/env";
import {
  getPublicScorecardBySlug,
} from "@/lib/geo/scorecard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const card = await getPublicScorecardBySlug(slug);
  if (!card) {
    return {
      title: "Scorecard not found | Xoopa",
      robots: { index: false, follow: false },
    };
  }

  const scoreLabel =
    card.score != null ? `${card.score}/100` : "not enough data yet";
  const title = `${card.brandName} AI visibility scorecard | Xoopa`;
  const description = `${card.brandName}: ${scoreLabel}. Per-model citation rates and sentiment from live Xoopa citation runs.`;

  return {
    title,
    description,
    alternates: { canonical: `/score/${slug}` },
    openGraph: {
      title,
      description,
      url: `/score/${slug}`,
      siteName: "Xoopa",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function PublicScorecardPage({ params }: PageProps) {
  const { slug } = await params;
  // Live read every request — toggled-off scorecards 404 immediately (no CDN cache).
  const card = await getPublicScorecardBySlug(slug);
  if (!card) notFound();

  const shareUrl = `${getBaseUrl()}/score/${slug}`;
  const tweetText =
    card.score != null
      ? `Our AI visibility score on Xoopa is ${card.score}/100. See the breakdown:`
      : `Tracking our AI visibility on Xoopa. Score pending more citation runs:`;
  const shareHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(shareUrl)}`;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="ds-container flex h-14 items-center justify-between">
          <Link href="/" className="text-sm font-medium tracking-tight">
            Xoopa
          </Link>
          <Link
            href={shareHref}
            target="_blank"
            rel="noopener noreferrer"
            className="ds-btn-secondary px-4 py-2 text-xs"
          >
            Share on X
          </Link>
        </div>
      </header>

      <section className="ds-container pb-10 pt-12 md:pb-14 md:pt-16">
        <p className="ds-kicker">Public AI visibility scorecard</p>
        <h1 className="mt-3 max-w-3xl text-[36px] leading-[1.1] tracking-[-0.03em] md:text-[48px]">
          {card.brandName}
        </h1>
        <p className="mt-4 max-w-[52ch] text-muted-foreground">
          Aggregate citation metrics from live model runs. Prompts, raw responses, and
          account details are not shown here.
        </p>
      </section>

      <section className="ds-container grid gap-4 md:grid-cols-3">
        <StatCard
          label="AI visibility score"
          value={card.sufficientData && card.score != null ? card.score : "—"}
          hint={
            card.sufficientData
              ? "0–100 · equal-weight average of per-model mention rates"
              : (card.insufficientReason ?? "Not enough successful runs yet")
          }
        />
        <StatCard
          label="Successful runs"
          value={card.successfulRuns}
          hint={`${card.modelsWithData} model${card.modelsWithData === 1 ? "" : "s"} with data`}
        />
        <StatCard
          label="Your rank vs tracked set"
          value={
            card.anonymousRank.yourRank != null
              ? `#${card.anonymousRank.yourRank}`
              : "—"
          }
          hint={card.anonymousRank.label}
        />
      </section>

      {!card.sufficientData ? (
        <section className="ds-container mt-8">
          <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6">
            <h2 className="text-lg font-medium tracking-tight">
              Not enough data for a score yet
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              {card.insufficientReason} We would rather show this empty state than a
              misleadingly confident number.
            </p>
          </div>
        </section>
      ) : null}

      <section className="ds-container mt-12" aria-labelledby="models-heading">
        <h2 id="models-heading" className="text-2xl tracking-tight">
          Per-model citation rate
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Mention rate on successful runs. Models with no successful runs show as n/a.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {card.models.map((row) => (
            <div key={row.model} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium tracking-tight">{row.label}</p>
                <DataPill tone={row.total > 0 ? "soft" : "outline"}>
                  {row.mentionRate == null ? "n/a" : `${row.mentionRate}%`}
                </DataPill>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {row.mentioned}/{row.total} successful runs mentioned the brand
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="ds-container mt-12" aria-labelledby="sentiment-heading">
        <h2 id="sentiment-heading" className="text-2xl tracking-tight">
          Sentiment on mentions
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Only runs where the brand was mentioned. Unclassified stays unclassified.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <DataPill tone="soft">Positive {card.sentiment.positive}</DataPill>
          <DataPill tone="outline">Neutral {card.sentiment.neutral}</DataPill>
          <DataPill tone="outline">Negative {card.sentiment.negative}</DataPill>
          <DataPill tone="outline">
            Unclassified {card.sentiment.unclassified}
          </DataPill>
        </div>
      </section>

      <section className="ds-container mt-12" aria-labelledby="rank-heading">
        <h2 id="rank-heading" className="text-2xl tracking-tight">
          Rank vs tracked set
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Your position among brands you track. Other brand names are not shown on this
          public page.
        </p>
        <div className="mt-6 rounded-xl border border-border bg-card p-6">
          <p className="text-lg font-medium tracking-tight">{card.anonymousRank.label}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Rank uses aggregate mention rates on successful citation runs. Named competitor
            breakdowns stay on your private dashboard Compare view.
          </p>
        </div>
      </section>

      <section className="ds-container mt-12 mb-16" aria-labelledby="method-heading">
        <h2 id="method-heading" className="text-2xl tracking-tight">
          How this score is calculated
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {card.methodology}
        </p>
        <ul className="mt-4 max-w-2xl list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          {card.methodologyDetail.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-muted-foreground">
          Generated {new Date(card.generatedAt).toISOString().slice(0, 16)}Z.
        </p>
      </section>

      <footer className="border-t border-border">
        <div className="ds-container flex flex-wrap items-center justify-between gap-3 py-8 text-sm text-muted-foreground">
          <p>
            Tracked with{" "}
            <Link
              href="/"
              className="font-medium text-foreground underline underline-offset-4"
            >
              Xoopa
            </Link>
          </p>
          <Link href="/pricing" className="hover:text-foreground">
            See plans
          </Link>
        </div>
      </footer>
    </main>
  );
}

