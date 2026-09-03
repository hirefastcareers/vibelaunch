import Link from "next/link";
import { getSession } from "@/lib/session";
import { CitationSweep } from "@/components/home/citation-sweep";
import { PlatformTabs } from "@/components/home/platform-tabs";
import { RankingTable } from "@/components/home/ranking-table";
import { CitationHeatmap } from "@/components/home/citation-heatmap";
import { EngineDonut } from "@/components/home/engine-donut";
import { CompetitorMatrix } from "@/components/home/competitor-matrix";
import { LiveActivityFeed } from "@/components/home/live-activity-feed";
import { RoiCalculator } from "@/components/home/roi-calculator";
import { StatsTicker } from "@/components/home/stats-ticker";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { Logo } from "@/components/logo";
import type { CitationTrendPoint } from "@/lib/geo/analytics";

export const dynamic = "force-dynamic";

const rankingRows = [
  { prompt: "Best SEO automation for indie hackers", chatgpt: 2, perplexity: 1, claude: 3, trend: "up" as const, lastChecked: "2h ago" },
  { prompt: "Tools to auto-post product updates to X", chatgpt: 1, perplexity: 4, claude: 2, trend: "up" as const, lastChecked: "2h ago" },
  { prompt: "GEO tools for small SaaS", chatgpt: 3, perplexity: 2, claude: 1, trend: "stable" as const, lastChecked: "2h ago" },
  { prompt: "Changelog SEO automation", chatgpt: 1, perplexity: 3, claude: null, trend: "new" as const, lastChecked: "2h ago" },
  { prompt: "AI content distribution platform", chatgpt: 4, perplexity: 2, claude: 3, trend: "up" as const, lastChecked: "2h ago" },
  { prompt: "Automated social media for founders", chatgpt: 2, perplexity: 5, claude: 4, trend: "down" as const, lastChecked: "2h ago" },
];

const heatmapData = Array.from({ length: 24 }, (_, i) => ({
  week: `W${i + 1}`,
  citations: Math.round(Math.random() * 18 + (i > 12 ? 8 : 2)),
}));

const engineSlices = [
  { name: "ChatGPT", value: 42, color: "hsl(var(--primary))" },
  { name: "Perplexity", value: 35, color: "hsl(var(--info))" },
  { name: "Claude", value: 23, color: "hsl(var(--chart-4))" },
];

const competitorRows = [
  { name: "Sorano", shareOfVoice: 62, citationRate: 78, avgPosition: 1.8, trend: "up" as const, highlighted: true },
  { name: "Competitor A", shareOfVoice: 44, citationRate: 52, avgPosition: 3.2, trend: "down" as const },
  { name: "Competitor B", shareOfVoice: 31, citationRate: 38, avgPosition: 4.1, trend: "stable" as const },
  { name: "Competitor C", shareOfVoice: 18, citationRate: 22, avgPosition: 5.0, trend: "down" as const },
];

const citations = [
  { engine: "ChatGPT", state: "Cited · Pos 2", cited: true },
  { engine: "Perplexity", state: "Cited · Pos 1", cited: true },
  { engine: "Claude", state: "Cited · Pos 3", cited: true },
];

const dashboardPreviewData: CitationTrendPoint[] = [
  { date: "2026-07-06", perplexity: 22.2, chatgpt: 11.1 },
  { date: "2026-07-13", perplexity: 33.3, chatgpt: 22.2, claude: 11.1 },
  { date: "2026-07-20", perplexity: 44.4, chatgpt: 22.2, claude: 22.2 },
  { date: "2026-07-27", perplexity: 55.6, chatgpt: 33.3, claude: 22.2 },
  { date: "2026-08-03", perplexity: 66.7, chatgpt: 44.4, claude: 33.3 },
  { date: "2026-08-10", perplexity: 77.8, chatgpt: 44.4, claude: 44.4 },
];
const dashboardPreviewSeries = [
  { key: "perplexity", label: "Perplexity", featured: true },
  { key: "chatgpt", label: "ChatGPT" },
  { key: "claude", label: "Claude" },
];

const compare = [
  { job: "Write the post", old: "You, at 11pm, staring at a blank composer", next: "Drafted from your best-performing hooks, scored before it queues" },
  { job: "Publish the article", old: "Copy the changelog into a CMS, fix the metadata", next: "Static page, internal links and sitemap ping on publish" },
  { job: "Capture the media", old: "Screenshot tool, crop, upload, repeat", next: "Playwright captures the screens your update touched" },
  { job: "Get cited by AI", old: "Nobody is checking", next: "240 prompts swept weekly across three engines" },
  { job: "Learn what worked", old: "Three dashboards and a spreadsheet", next: "Engagement feeds straight back into the next generation" },
];

const cadence = [
  { what: "Social posts", detail: "Drafted, scored and queued from your updates.", freq: "5-7 / week", icon: "📤" },
  { what: "Articles", detail: "Changelog entries expanded into static, indexed pages.", freq: "1-3 / week", icon: "📄" },
  { what: "UI media", detail: "Playwright captures of the screens your update touched.", freq: "Per ship", icon: "📸" },
  { what: "Citation sweep", detail: "Checks whether AI engines recommend you.", freq: "Weekly", icon: "🎯" },
  { what: "Health audit", detail: "Indexing, sitemap, metadata and media coverage in one report.", freq: "Weekly", icon: "✅" },
];

const pricing = [
  { tier: "Free", price: "$0", period: "", limits: "1 project · 8 posts/month", features: ["AI post generation", "Basic analytics", "1 citation sweep/week"], featured: false },
  { tier: "Starter", price: "$19", period: "/mo", limits: "3 projects · 40 posts/month", features: ["Everything in Free", "SEO articles", "Full citation tracking", "Priority queue"], featured: true },
  { tier: "Pro", price: "$49", period: "/mo", limits: "10 projects · 200 posts/month", features: ["Everything in Starter", "Competitor analysis", "API access", "White-label reports"], featured: false },
];

const faqs = [
  { q: "Do I have to write anything?", a: "Two lines about what you shipped. Sorano handles the posts, the article, the media and the structured data for AI search." },
  { q: "Will the posts sound generated?", a: "They are built from your own best-performing posts. Engagement data feeds back in, so voice and hooks tighten over time." },
  { q: "What is GEO, exactly?", a: "Generative Engine Optimization: making your content the kind of source ChatGPT and Perplexity quote when someone asks for a tool like yours." },
  { q: "How is this different from an SEO suite?", a: "Suites tell you what to fix. Sorano writes, publishes and tracks it from the update you already wrote." },
  { q: "What do I connect?", a: "Sign in with X. No API keys, no separate CMS, no scheduling tool on the side." },
];

const footerCols = [
  { head: "PLATFORM", links: [{ label: "Posts & hooks", href: "#platform" }, { label: "Articles & SEO", href: "#platform" }, { label: "AI visibility", href: "#visibility" }, { label: "Pricing", href: "#pricing" }, { label: "Sign in", href: "/auth/signin" }] },
  { head: "RESOURCES", links: [{ label: "Changelog", href: "/changelog" }, { label: "Blog", href: "/blog" }, { label: "GEO guide", href: "/blog" }, { label: "Status", href: "/status" }] },
  { head: "COMPANY", links: [{ label: "About", href: "/about" }, { label: "Privacy", href: "/privacy" }, { label: "Terms", href: "/terms" }, { label: "@sorano", href: "https://x.com" }] },
];

export default async function HomePage() {
  const session = await getSession();
  const signedIn = Boolean(session);
  const ctaHref = signedIn ? "/dashboard" : "/auth/signin";
  const heroCta = signedIn ? "GO TO DASHBOARD" : "START FREE";
  const navCta = signedIn ? "DASHBOARD" : "SIGN IN WITH X";
  const bottomCta = signedIn ? "GO TO DASHBOARD" : "START FREE — NO CARD REQUIRED";
  const userLabel = session?.user.xUsername
    ? `@${session.user.xUsername}`
    : session?.user.name;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteNav signedIn={signedIn} navCta={navCta} userLabel={userLabel} />

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-background via-background to-muted/30">
        <div className="ds-container pb-16 pt-16 md:pb-24 md:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              <span className="font-mono text-[11px] tracking-wider text-muted-foreground">
                AUTONOMOUS GROWTH ENGINE
              </span>
            </div>
            <h1 className="mb-6 text-[40px] md:text-[56px] lg:text-[72px]">
              Ship once.{" "}
              <span className="italic text-primary">Get found</span>{" "}
              everywhere.
            </h1>
            <p className="mx-auto mb-10 max-w-[52ch] text-lg leading-relaxed text-muted-foreground md:text-xl">
              Sorano turns your product updates into viral social posts, Google-ranked articles,
              and AI search citations — automatically.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href={ctaHref} className="ds-btn px-8 py-4 text-sm">
                {heroCta}
              </Link>
              <Link href="#platform" className="ds-btn-secondary px-8 py-4 text-sm">
                SEE HOW IT WORKS
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 font-mono text-[11px] tracking-wider text-muted-foreground">
              <span>✓ Sign in with X</span>
              <span>✓ No API keys</span>
              <span>✓ Free tier available</span>
            </div>
          </div>

          {/* Dashboard Preview Widget */}
          <div className="mx-auto mt-16 max-w-4xl">
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-lg">
              <div className="flex items-center justify-between border-b border-border bg-muted/50 px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-red-400" />
                    <span className="h-3 w-3 rounded-full bg-amber-400" />
                    <span className="h-3 w-3 rounded-full bg-green-400" />
                  </div>
                  <span className="font-mono text-[11px] tracking-wider text-muted-foreground">
                    SORANO DASHBOARD
                  </span>
                </div>
                <span className="font-mono text-[10px] text-muted-foreground">sorano.app/dashboard</span>
              </div>
              <div className="grid grid-cols-2 gap-px bg-border md:grid-cols-4">
                <MiniStat label="Share of Voice" value="62%" trend="+14 pts" positive />
                <MiniStat label="Citations This Week" value="38" trend="+12" positive />
                <MiniStat label="Posts Shipped" value="24" trend="+6" positive />
                <MiniStat label="Pages Indexed" value="12" trend="+2" positive />
              </div>
              <div className="p-6">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                    Citation Trend — Last 6 Weeks
                  </span>
                  <span className="rounded-md bg-green-50 px-2 py-0.5 font-mono text-[10px] text-green-600">
                    ▲ All engines rising
                  </span>
                </div>
                <TrendChart data={dashboardPreviewData} series={dashboardPreviewSeries} xKey="date" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS TICKER ─── */}
      <StatsTicker />

      {/* ─── PLATFORM ─── */}
      <section id="platform" className="ds-section border-b border-border">
        <div className="ds-container">
          <div className="mb-12 max-w-2xl">
            <span className="ds-kicker">01 — THE PLATFORM</span>
            <h2 className="mt-3 text-[32px] md:text-[40px] lg:text-[52px]">
              One update in. Four channels out.
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              Write two lines about what you shipped. Sorano handles the rest and feeds the results
              back into the next run.
            </p>
          </div>
          <PlatformTabs />
        </div>
      </section>

      {/* ─── AI VISIBILITY / GEO ─── */}
      <section id="visibility" className="ds-section border-b border-border bg-[#F4F3F1] text-foreground">
        <div className="ds-container">
          <div className="mb-12 max-w-2xl">
            <span className="ds-kicker">
              02 — GENERATIVE ENGINE OPTIMIZATION
            </span>
            <h2 className="mt-3 text-[32px] md:text-[40px] lg:text-[52px]">
              Google is no longer the only search box.
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              People ask ChatGPT and Perplexity which tool to use. Sorano tracks whether the answer
              names you, and structures your content until it does.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-[#E6E3DE] bg-[#FAFAF8] p-8 shadow-sm">
              <div className="mb-5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Tracked prompt
              </div>
              <p className="mb-8 text-[26px] font-medium leading-[1.25] tracking-[-0.02em] text-foreground md:text-[28px]">
                &ldquo;What&apos;s the best tool for an indie hacker to automate SEO and social
                posts?&rdquo;
              </p>
              <div className="flex flex-col gap-3 border-t border-[#E6E3DE] pt-5">
                <StatRow label="Tracked since" value="Mar 2026" />
                <StatRow label="Engines swept" value="3" />
                <StatRow label="Your best position" value="#1 of 5" />
              </div>
            </div>
            <CitationSweep citations={citations} />
          </div>
        </div>
      </section>

      {/* ─── RANKING TABLE ─── */}
      <section id="rankings" className="ds-section border-b border-border">
        <div className="ds-container">
          <div className="mb-12 max-w-2xl">
            <span className="ds-kicker">03 — PROMPT RANKINGS</span>
            <h2 className="mt-3 text-[32px] md:text-[40px] lg:text-[52px]">
              Track every prompt that matters.
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              See exactly where you rank across ChatGPT, Perplexity, and Claude — updated with every sweep.
            </p>
          </div>
          <RankingTable rows={rankingRows} />
        </div>
      </section>

      {/* ─── ANALYTICS WIDGETS ─── */}
      <section id="analytics" className="ds-section border-b border-border bg-card">
        <div className="ds-container">
          <div className="mb-12 max-w-2xl">
            <span className="ds-kicker">04 — ANALYTICS</span>
            <h2 className="mt-3 text-[32px] md:text-[40px] lg:text-[52px]">
              Data you can act on.
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              Not vanity metrics. Real citation data, competitor benchmarks, and trend analysis across every AI engine.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <EngineDonut data={engineSlices} centerLabel="Total Share" centerValue="62%" />
            <CitationHeatmap data={heatmapData} />
            <LiveActivityFeed />
          </div>
        </div>
      </section>

      {/* ─── COMPETITOR ANALYSIS ─── */}
      <section id="competitors" className="ds-section border-b border-border">
        <div className="ds-container">
          <div className="mb-12 max-w-2xl">
            <span className="ds-kicker">05 — COMPETITIVE INTELLIGENCE</span>
            <h2 className="mt-3 text-[32px] md:text-[40px] lg:text-[52px]">
              Know where you stand.
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              Side-by-side comparison of your AI visibility against every competitor in your space.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
            <CompetitorMatrix rows={competitorRows} />
            <RoiCalculator />
          </div>
        </div>
      </section>

      {/* ─── COMPARE TABLE ─── */}
      <section id="compare" className="ds-section border-b border-border bg-card">
        <div className="ds-container">
          <div className="mb-12 max-w-2xl">
            <span className="ds-kicker">06 — THE ALTERNATIVE</span>
            <h2 className="mt-3 text-[32px] md:text-[40px] lg:text-[52px]">
              Or you can keep running five tools.
            </h2>
          </div>

          <div className="overflow-hidden rounded-xl border border-border">
            <table className="ds-table">
              <thead>
                <tr>
                  <th className="min-w-[180px]">The Job</th>
                  <th className="min-w-[220px]">Stitched Stack</th>
                  <th className="min-w-[220px]">
                    <span className="text-primary">Sorano</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {compare.map((row) => (
                  <tr key={row.job}>
                    <td className="font-serif text-lg">{row.job}</td>
                    <td className="text-muted-foreground">{row.old}</td>
                    <td className="font-medium text-foreground">{row.next}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ─── CADENCE ─── */}
      <section className="ds-section border-b border-border">
        <div className="ds-container">
          <div className="mb-12 max-w-2xl">
            <span className="ds-kicker">07 — WHAT SHIPS WEEKLY</span>
            <h2 className="mt-3 text-[32px] md:text-[40px] lg:text-[52px]">
              Sorano never stops working.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {cadence.map((item) => (
              <div key={item.what} className="ds-card group">
                <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-lg transition-colors group-hover:bg-primary/20">
                  {item.icon}
                </span>
                <h3 className="mb-2 text-lg">{item.what}</h3>
                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{item.detail}</p>
                <span className="mt-auto inline-block rounded-md bg-muted px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {item.freq}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="pricing" className="ds-section border-b border-border bg-card">
        <div className="ds-container">
          <div className="mb-12 text-center">
            <span className="ds-kicker">08 — PRICING</span>
            <h2 className="mt-3 text-[32px] md:text-[40px] lg:text-[52px]">
              Free to try. Cheap to scale.
            </h2>
            <p className="mx-auto mt-4 max-w-[56ch] text-lg leading-relaxed text-muted-foreground">
              Every tier includes AI post generation and AI search citation tracking. Paid plans only
              raise how much you can ship.
            </p>
          </div>

          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-3">
            {pricing.map((plan) => (
              <div
                key={plan.tier}
                className={`flex flex-col rounded-xl border p-8 transition-shadow ${
                  plan.featured
                    ? "border-primary bg-background shadow-lg shadow-primary/10"
                    : "border-border bg-background shadow-sm hover:shadow-md"
                }`}
              >
                {plan.featured && (
                  <span className="mb-4 inline-block w-fit rounded-md bg-primary/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-primary">
                    Most Popular
                  </span>
                )}
                <div className="ds-label mb-3">{plan.tier.toUpperCase()}</div>
                <div className="mb-1 flex items-baseline gap-1">
                  <span className="ds-metric">{plan.price}</span>
                  {plan.period && (
                    <span className="font-mono text-sm text-muted-foreground">{plan.period}</span>
                  )}
                </div>
                <p className="mb-6 mt-2 text-sm text-muted-foreground">{plan.limits}</p>
                <ul className="mb-8 flex-1 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <span className="mt-0.5 text-green-500">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={signedIn ? "/dashboard/billing" : ctaHref}
                  className={plan.featured ? "ds-btn text-center" : "ds-btn-secondary text-center"}
                >
                  {signedIn ? "GO TO BILLING" : "START FREE"}
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center font-mono text-[11px] text-muted-foreground">
            Billed in your local currency at checkout. Cancel anytime.
          </p>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="ds-section border-b border-border">
        <div className="ds-container">
          <div className="mb-12 text-center">
            <span className="ds-kicker">09 — FAQ</span>
            <h2 className="mt-3 text-[32px] md:text-[40px]">
              Frequently asked questions
            </h2>
          </div>

          <div className="mx-auto max-w-3xl divide-y divide-border rounded-xl border border-border">
            {faqs.map((faq) => (
              <details key={faq.q} className="group">
                <summary className="flex cursor-pointer items-center justify-between px-6 py-5 text-left">
                  <h3 className="text-[18px] leading-snug lg:text-[20px]">{faq.q}</h3>
                  <span className="ml-4 shrink-0 font-mono text-lg text-muted-foreground transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <div className="px-6 pb-5">
                  <p className="text-[15px] leading-relaxed text-muted-foreground">{faq.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="ds-section border-b border-border bg-gradient-to-b from-card to-background">
        <div className="ds-container text-center">
          <h2 className="mx-auto max-w-[20ch] text-[32px] md:text-[40px] lg:text-[56px]">
            Your next update can do four jobs instead of one.
          </h2>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href={ctaHref} className="ds-btn px-8 py-4 text-sm">
              {bottomCta}
            </Link>
          </div>
          <p className="mt-4 font-mono text-[11px] text-muted-foreground">
            Sign in with X. No card, no setup call.
          </p>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-ink text-[#B5AFA5]">
        <div className="ds-container grid grid-cols-1 gap-10 pb-10 pt-14 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo size={32} ink="#F5F3F0" />
            <p className="mb-0 mt-3 max-w-[30ch] text-sm leading-relaxed">
              Autonomous SEO, GEO and X growth for solo founders shipping fast.
            </p>
          </div>
          {footerCols.map((col) => (
            <div key={col.head} className="flex flex-col gap-3">
              <div className="font-mono text-[10px] tracking-widest text-[#8C857A]">{col.head}</div>
              {col.links.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-sm text-[#B5AFA5] transition-colors hover:text-primary"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
        <div className="ds-container flex flex-wrap justify-between gap-6 border-t border-ink-rule pb-11 pt-5 font-mono text-[10px] tracking-widest text-[#8C857A]">
          <span>© 2026 SORANO.APP</span>
          <span>BUILT FOR PEOPLE WHO SHIP</span>
        </div>
      </footer>
    </main>
  );
}

function SiteNav({
  signedIn,
  navCta,
  userLabel,
}: {
  signedIn: boolean;
  navCta: string;
  userLabel?: string | null;
}) {
  return (
    <nav className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="ds-container flex h-16 items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo size={28} />
          <span className="hidden font-mono text-[10px] tracking-widest text-muted-foreground sm:inline">
            SEO · GEO · X
          </span>
        </Link>
        <div className="flex items-center gap-5 font-mono text-[11px] tracking-wider">
          <Link href="#platform" className="hidden text-muted-foreground transition-colors hover:text-foreground md:inline">
            PLATFORM
          </Link>
          <Link href="#visibility" className="hidden text-muted-foreground transition-colors hover:text-foreground md:inline">
            AI VISIBILITY
          </Link>
          <Link href="#rankings" className="hidden text-muted-foreground transition-colors hover:text-foreground lg:inline">
            RANKINGS
          </Link>
          <Link href="#pricing" className="hidden text-muted-foreground transition-colors hover:text-foreground md:inline">
            PRICING
          </Link>
          <Link href="#faq" className="hidden text-muted-foreground transition-colors hover:text-foreground lg:inline">
            FAQ
          </Link>
          {signedIn ? (
            <>
              <Link href="/dashboard" className="ds-btn-ink">
                {navCta}
              </Link>
              <span className="hidden text-muted-foreground lg:inline">{userLabel}</span>
            </>
          ) : (
            <Link href="/auth/signin" className="ds-btn-ink">
              {navCta}
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

function MiniStat({
  label,
  value,
  trend,
  positive,
}: {
  label: string;
  value: string;
  trend: string;
  positive?: boolean;
}) {
  return (
    <div className="bg-card px-5 py-5">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1.5 flex items-baseline gap-2">
        <span className="font-serif text-[28px] leading-none tracking-tight">{value}</span>
        <span
          className={`font-mono text-[11px] ${positive ? "text-green-600" : "text-red-500"}`}
        >
          {positive ? "▲" : "▼"} {trend}
        </span>
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-[13px]">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
