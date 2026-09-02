import Link from "next/link";
import { getSession } from "@/lib/session";
import { isDemoMode } from "@/lib/demo-mode";
import { CitationSweep } from "@/components/home/citation-sweep";
import { PlatformTabs } from "@/components/home/platform-tabs";
import { SectionIndex } from "@/components/home/section-index";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { Logo } from "@/components/logo";
import type { CitationTrendPoint } from "@/lib/geo/analytics";

export const dynamic = "force-dynamic";

const integrations = [
  "X / TWITTER",
  "GOOGLE SEARCH CONSOLE",
  "CHATGPT",
  "PERPLEXITY",
  "PLAYWRIGHT",
];

const stats = [
  { n: "40 sec", label: "of your day per shipped feature" },
  { n: "4", label: "channels fed from one changelog entry" },
  { n: "3", label: "AI engines swept for citations each week" },
  { n: "1", label: "login instead of a five-tool stack" },
];

const shareRows = [
  { name: "Sorano", pct: "62%", val: "38%", bar: "bg-primary", label: "text-foreground" },
  { name: "Competitor A", pct: "44%", val: "27%", bar: "bg-ink", label: "text-ink-muted" },
  { name: "Competitor B", pct: "31%", val: "19%", bar: "bg-[#8C857A]", label: "text-ink-muted" },
  { name: "Everyone else", pct: "26%", val: "16%", bar: "bg-surface-muted", label: "text-ink-muted" },
];

const promptStats = [
  { k: "TRACKED SINCE", v: "MAR 2026" },
  { k: "ENGINES SWEPT", v: "3" },
  { k: "YOUR BEST POSITION", v: "2 OF 5" },
];

const citations = [
  { engine: "ChatGPT", state: "CITED · POS 2", cited: true },
  { engine: "Perplexity", state: "CITED · POS 4", cited: true },
  { engine: "Claude", state: "CITED · POS 3", cited: true },
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
  {
    job: "Write the post",
    old: "You, at 11pm, staring at a blank composer",
    next: "Drafted from your best-performing hooks, scored before it queues",
  },
  {
    job: "Publish the article",
    old: "Copy the changelog into a CMS, fix the metadata",
    next: "Static page, internal links and sitemap ping on publish",
  },
  {
    job: "Capture the media",
    old: "Screenshot tool, crop, upload, repeat",
    next: "Playwright captures the screens your update touched",
  },
  {
    job: "Get cited by AI",
    old: "Nobody is checking",
    next: "240 prompts swept weekly across three engines",
  },
  {
    job: "Learn what worked",
    old: "Three dashboards and a spreadsheet",
    next: "Engagement feeds straight back into the next generation",
  },
];

const cadence = [
  {
    what: "Social posts",
    detail: "Drafted, scored and queued from your updates - you approve or let it run.",
    freq: "5-7 / WEEK",
  },
  {
    what: "Articles",
    detail: "Changelog entries expanded into static pages with internal linking.",
    freq: "1-3 / WEEK",
  },
  {
    what: "UI media",
    detail: "Playwright captures of the screens your update touched.",
    freq: "PER SHIP",
  },
  {
    what: "Citation sweep",
    detail: "Checks whether AI engines recommend you, and what to fix if not.",
    freq: "WEEKLY",
  },
  {
    what: "Health audit",
    detail: "Indexing, sitemap, metadata and media coverage in one report.",
    freq: "WEEKLY",
  },
];

const pricing = [
  { tier: "Free", price: "$0", period: "", limits: "1 project · 8 posts/month", featured: false },
  { tier: "Starter", price: "$19", period: "/mo", limits: "3 projects · 40 posts/month", featured: true },
  { tier: "Pro", price: "$49", period: "/mo", limits: "10 projects · 200 posts/month", featured: false },
];

const faqs = [
  {
    q: "Do I have to write anything?",
    a: "Two lines about what you shipped. Sorano handles the posts, the article, the media and the structured data for AI search.",
  },
  {
    q: "Will the posts sound generated?",
    a: "They are built from your own best-performing posts. Engagement data feeds back in, so voice and hooks tighten over time.",
  },
  {
    q: "What is GEO, exactly?",
    a: "Generative Engine Optimization: making your content the kind of source ChatGPT and Perplexity quote when someone asks for a tool like yours.",
  },
  {
    q: "How is this different from an SEO suite?",
    a: "Suites tell you what to fix. Sorano writes, publishes and tracks it from the update you already wrote.",
  },
  {
    q: "What do I connect?",
    a: "Sign in with X. No API keys, no separate CMS, no scheduling tool on the side.",
  },
];

const footerCols = [
  {
    head: "PLATFORM",
    links: [
      { label: "Posts & hooks", href: "#platform" },
      { label: "Articles & SEO", href: "#platform" },
      { label: "AI visibility", href: "#visibility" },
      { label: "Pricing", href: "#pricing" },
      { label: "Dashboard demo", href: "/auth/signin" },
    ],
  },
  {
    head: "RESOURCES",
    links: [
      { label: "Changelog", href: "/changelog" },
      { label: "Blog", href: "/blog" },
      { label: "GEO guide", href: "/blog" },
      { label: "Status", href: "/status" },
    ],
  },
  {
    head: "COMPANY",
    links: [
      { label: "About", href: "/about" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "@sorano", href: "https://x.com" },
    ],
  },
];

export default async function HomePage() {
  const session = await getSession();
  const demo = isDemoMode();
  const signedIn = Boolean(session);
  const ctaHref = signedIn ? "/dashboard" : "/auth/signin";
  const heroCta = signedIn ? "GO TO DASHBOARD" : "TRY DEMO DASHBOARD";
  const navCta = signedIn ? "DASHBOARD" : demo ? "DEMO LOGIN" : "SIGN IN WITH X";
  const bottomCta = signedIn ? "GO TO DASHBOARD" : "SIGN IN WITH X";
  const userLabel = session?.user.xUsername
    ? `@${session.user.xUsername}`
    : session?.user.name;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <DemoBanner visible={demo} />
      <SiteNav signedIn={signedIn} navCta={navCta} userLabel={userLabel} />

      <section className="border-b border-border bg-background">
        <div className="ds-container grid grid-cols-1 items-stretch bg-background lg:grid-cols-2">
          <div className="flex flex-col justify-center border-b border-border py-14 lg:border-b-0 lg:border-r lg:py-[76px] lg:pr-14">
            <div className="ds-label mb-[26px] flex items-center gap-2.5">
              <span className="size-1.5 animate-sorano-blink rounded-full bg-primary" />
              <span>AUTONOMOUS GROWTH ENGINE</span>
            </div>
            <h1 className="mb-[22px] max-w-[14ch] font-serif text-pretty text-[37px] md:text-[50px] lg:text-[70px]">
              Ship once.
              <br />
              Get found <span className="font-serif italic text-accent">everywhere</span>.
            </h1>
            <p className="mb-8 max-w-[44ch] text-pretty text-[18.5px] leading-[1.55] text-ink-muted">
              Sorano turns your product updates into viral social posts, Google-ranked articles,
              and AI search recommendations - automatically.
            </p>
            <div className="mb-[30px] flex flex-col items-stretch gap-3.5 sm:flex-row sm:items-center">
              <Link href={ctaHref} className="ds-btn text-center">
                {heroCta}
              </Link>
              <Link
                href="#platform"
                className="rounded-full border border-border px-5 py-3.5 text-center font-mono text-xs tracking-[0.1em] text-ink-muted hover:border-foreground"
              >
                SEE THE PLATFORM
              </Link>
            </div>
            <div className="ds-label flex flex-wrap gap-7 border-t border-border pt-[18px]">
              <span>SIGN IN WITH X</span>
              <span>NO API KEYS</span>
              <span>NO SECOND CMS</span>
            </div>
          </div>

          <div className="flex items-center bg-background py-10 lg:pl-14">
            <div className="w-full border border-ink bg-white">
              <div className="flex items-center justify-between bg-ink px-4 py-[11px] font-mono text-[10px] tracking-[0.1em] text-background">
                <span>SORANO / AI VISIBILITY</span>
                <span className="text-[#8C857A]">LAST 30 DAYS</span>
              </div>
              <div className="flex items-baseline gap-3.5 border-b border-border px-5 pb-2 pt-[22px]">
                <div>
                  <div className="font-serif text-[40px] leading-none tracking-[-0.03em] lg:text-[48px]">38%</div>
                  <div className="ds-label mt-1.5">SHARE OF ANSWERS</div>
                </div>
                <div className="ml-auto text-right">
                  <div className="font-mono text-[11px] text-accent">▲ +14 PTS</div>
                  <div className="ds-label mt-1.5">VS PRIOR PERIOD</div>
                </div>
              </div>
              <div className="flex flex-col gap-[13px] px-5 py-[18px] pb-5">
                {shareRows.map((row) => (
                  <div
                    key={row.name}
                    className="grid grid-cols-[minmax(0,5.5rem)_1fr_2.5rem] items-center gap-3 font-mono text-[11px] sm:grid-cols-[128px_1fr_42px]"
                  >
                    <span className={`overflow-hidden text-ellipsis whitespace-nowrap ${row.label}`}>
                      {row.name}
                    </span>
                    <span className="block h-2.5 bg-[#EFEBE4]">
                      <span className={`block h-2.5 ${row.bar}`} style={{ width: row.pct }} />
                    </span>
                    <span className="text-right text-ink-muted">{row.val}</span>
                  </div>
                ))}
              </div>
              <div className="ds-label flex flex-wrap justify-between gap-2 border-t border-border px-5 py-3">
                <span>SOURCE: CHATGPT · PERPLEXITY · CLAUDE</span>
                <span>N=240 PROMPTS</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-card">
        <div className="ds-container flex flex-wrap items-center gap-8 py-[22px]">
          <span className="ds-label">WORKS WITH</span>
          {integrations.map((tool) => (
            <span key={tool} className="ds-label">
              {tool}
            </span>
          ))}
        </div>
      </section>

      <section className="border-b border-border">
        <div className="ds-container">
          <div className="grid grid-cols-1 gap-px border-x border-border bg-border md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.n} className="bg-background px-6 py-[30px]">
                <div className="font-serif text-[40px] leading-none tracking-[-0.03em]">{stat.n}</div>
                <div className="mt-2.5 text-pretty text-sm leading-[1.45] text-ink-muted">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="platform" className="border-b border-border">
        <div className="ds-container py-[76px]">
          <div className="ds-shell mb-10">
            <SectionIndex className="ds-kicker pt-2.5">01 - THE PLATFORM</SectionIndex>
            <div>
              <h2 className="mb-3.5 max-w-[22ch] text-[27px] md:text-[34px] lg:text-[44px]">
                One update in. Four channels out.
              </h2>
              <p className="m-0 max-w-[56ch] text-pretty text-[17px] leading-[1.6] text-ink-muted">
                Write two lines about what you shipped. Sorano handles the rest and feeds the results
                back into the next run.
              </p>
            </div>
          </div>
          <PlatformTabs />
        </div>
      </section>

      <section id="visibility" className="border-b border-ink bg-ink text-background">
        <div className="ds-container py-20">
          <div className="ds-shell mb-11">
            <SectionIndex className="pt-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
              02 - GENERATIVE ENGINE OPTIMIZATION
            </SectionIndex>
            <div>
              <h2 className="mb-3.5 max-w-[24ch] text-[27px] md:text-[34px] lg:text-[44px]">
                Google is no longer the only search box.
              </h2>
              <p className="m-0 max-w-[56ch] text-pretty text-[17px] leading-[1.6] text-[#B5AFA5]">
                People ask ChatGPT and Perplexity which tool to use. Sorano tracks whether the answer
                names you, and structures your content until it does.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-px border border-ink-rule bg-ink-rule lg:grid-cols-2">
            <div className="bg-ink-panel p-[30px]">
              <div className="mb-5 font-mono text-[10px] tracking-[0.14em] text-[#8C857A]">
                TRACKED PROMPT
              </div>
              <p className="mb-[26px] font-serif text-[28px] leading-[1.25] text-background">
                &ldquo;What&apos;s the best tool for an indie hacker to automate SEO and social
                posts?&rdquo;
              </p>
              <div className="flex flex-col gap-3 border-t border-ink-rule pt-5">
                {promptStats.map((stat) => (
                  <div key={stat.k} className="flex justify-between font-mono text-[11px]">
                    <span className="tracking-[0.06em] text-[#8C857A]">{stat.k}</span>
                    <span className="text-[#E5E0D8]">{stat.v}</span>
                  </div>
                ))}
              </div>
            </div>
            <CitationSweep citations={citations} simulated={demo} />
          </div>
        </div>
      </section>

      <section id="dashboard-preview" className="border-b border-border bg-background">
        <div className="ds-container py-[76px]">
          <div className="ds-shell mb-10">
            <div className="ds-kicker pt-2.5">03 - SEE THE DASHBOARD</div>
            <div>
              <h2 className="mb-3.5 max-w-[22ch] text-[27px] md:text-[34px] lg:text-[44px]">
                This is the exact chart that tracks your citations.
              </h2>
              <p className="m-0 max-w-[56ch] text-pretty text-[17px] leading-[1.6] text-ink-muted">
                Not a mockup — the same component your dashboard renders once you&apos;re tracking a real
                project.
              </p>
            </div>
          </div>

          <div className="border border-border bg-card p-[30px]">
            <div className="mb-5 flex items-center justify-between font-mono text-[10px] tracking-[0.14em] text-muted-foreground">
              <span>WEEKLY CITATION RATE</span>
              <span>EXAMPLE DATA</span>
            </div>
            <TrendChart data={dashboardPreviewData} series={dashboardPreviewSeries} xKey="date" />
            <p className="mt-4 font-mono text-[11px] tracking-[0.04em] text-muted-foreground">
              Example project shown. Your dashboard tracks citation rate for your own product across
              ChatGPT, Perplexity, and Claude.
            </p>
          </div>
        </div>
      </section>

      <section id="compare" className="border-b border-border bg-card">
        <div className="ds-container py-[76px]">
          <div className="ds-shell mb-10">
            <SectionIndex className="ds-kicker pt-2.5">04 - THE ALTERNATIVE</SectionIndex>
            <h2 className="m-0 max-w-[22ch] text-[27px] md:text-[34px] lg:text-[44px]">
              Or you can keep running five tools.
            </h2>
          </div>

          <div className="border border-ink bg-background">
            <div className="grid grid-cols-1 gap-px bg-ink lg:grid-cols-[1.2fr_1fr_1fr]">
              <div className="bg-ink px-5 py-3.5 font-mono text-[10px] tracking-[0.14em] text-[#8C857A]">
                THE JOB
              </div>
              <div className="bg-ink px-5 py-3.5 font-mono text-[10px] tracking-[0.14em] text-[#8C857A]">
                STITCHED STACK
              </div>
              <div className="bg-ink px-5 py-3.5 font-mono text-[10px] tracking-[0.14em] text-primary">
                SORANO
              </div>
            </div>
            {compare.map((row) => (
              <div
                key={row.job}
                className="grid grid-cols-1 border-b border-border lg:grid-cols-[1.2fr_1fr_1fr]"
              >
                <div className="border-border px-5 py-[18px] font-serif text-[21px] tracking-[-0.01em] lg:border-r">
                  {row.job}
                </div>
                <div className="border-border px-5 py-[18px] text-pretty text-[14.5px] leading-[1.5] text-muted-foreground lg:border-r">
                  {row.old}
                </div>
                <div className="px-5 py-[18px] text-pretty text-[14.5px] leading-[1.5] text-foreground">
                  {row.next}
                </div>
              </div>
            ))}
            <div className="flex flex-wrap justify-between gap-5 px-5 py-[18px] font-mono text-[11px] tracking-[0.06em] text-ink-muted">
              <span>FIVE SUBSCRIPTIONS, FIVE LOGINS, NOTHING TALKS TO ANYTHING</span>
              <span className="text-accent">ONE ENGINE, ONE LOGIN</span>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="ds-container ds-shell py-[72px]">
          <SectionIndex className="ds-kicker pt-2">05 - WHAT SHIPS WEEKLY</SectionIndex>
          <div className="border-t border-ink">
            {cadence.map((row) => (
              <div
                key={row.what}
                className="grid grid-cols-1 items-baseline gap-1.5 border-b border-border py-5 lg:grid-cols-[210px_1fr_120px] lg:gap-6"
              >
                <div className="font-serif text-[22px] tracking-[-0.01em]">{row.what}</div>
                <div className="text-pretty text-[14.5px] leading-[1.5] text-ink-muted">
                  {row.detail}
                </div>
                <div className="font-mono text-[10px] tracking-[0.1em] text-muted-foreground lg:text-right">
                  {row.freq}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="border-b border-border bg-card">
        <div className="ds-container py-[76px]">
          <div className="ds-shell mb-10">
            <div className="ds-kicker pt-2.5">06 - PRICING</div>
            <div>
              <h2 className="mb-3.5 max-w-[22ch] text-[27px] md:text-[34px] lg:text-[44px]">
                Free to try. Cheap to scale.
              </h2>
              <p className="m-0 max-w-[56ch] text-pretty text-[17px] leading-[1.6] text-ink-muted">
                Every tier includes AI post generation and AI search citation tracking. Paid plans only
                raise how much you can ship — nothing is feature-gated.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-px border border-border bg-border lg:grid-cols-3">
            {pricing.map((plan) => (
              <div
                key={plan.tier}
                className={`flex flex-col justify-between bg-background p-[30px] ${plan.featured ? "border-2 border-primary" : ""}`}
              >
                <div>
                  <div className="ds-label mb-4">{plan.tier.toUpperCase()}</div>
                  <div className="mb-1 flex items-baseline gap-1">
                    <span className="font-serif text-[40px] leading-none tracking-[-0.03em]">{plan.price}</span>
                    {plan.period && <span className="font-mono text-xs text-muted-foreground">{plan.period}</span>}
                  </div>
                  <p className="mb-6 mt-3 text-pretty text-sm leading-[1.5] text-ink-muted">{plan.limits}</p>
                </div>
                <Link
                  href={signedIn ? "/dashboard/billing" : ctaHref}
                  className={plan.featured ? "ds-btn text-center" : "rounded-full border border-border px-5 py-3.5 text-center font-mono text-xs tracking-[0.1em] text-ink-muted hover:border-foreground"}
                >
                  {signedIn ? "GO TO BILLING" : "SIGN IN TO START"}
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-5 font-mono text-[11px] tracking-[0.04em] text-muted-foreground">
            Billed in your local currency at checkout.
          </p>
        </div>
      </section>

      <section id="faq" className="border-b border-border bg-card">
        <div className="ds-container ds-shell py-[72px]">
          <SectionIndex className="ds-kicker pt-2">07 - FAQ</SectionIndex>
          <div className="grid gap-px border border-border bg-border">
            {faqs.map((faq) => (
              <div
                key={faq.q}
                className="grid grid-cols-1 items-start gap-3.5 bg-background px-7 py-[26px] lg:grid-cols-[1fr_1.25fr] lg:gap-8"
              >
                <h3 className="m-0 text-[21px] leading-[1.2] tracking-[-0.01em] lg:text-[23px]">
                  {faq.q}
                </h3>
                <p className="m-0 text-pretty text-[15px] leading-[1.6] text-ink-muted">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="ds-container flex flex-col items-start gap-[26px] py-[90px]">
          <h2 className="m-0 max-w-[19ch] text-[27px] md:text-[34px] lg:text-[56px] lg:leading-[1.02] lg:tracking-[-0.03em]">
            Your next update can do four jobs instead of one.
          </h2>
          <div className="flex flex-wrap items-center gap-[18px]">
            <Link href={ctaHref} className="ds-btn px-[26px] py-4">
              {bottomCta}
            </Link>
            <span className="font-mono text-[11px] tracking-[0.04em] text-muted-foreground">
              Demo dashboard. No card, no setup call.
            </span>
          </div>
        </div>
      </section>

      <footer className="bg-ink text-ink-dim">
        <div className="ds-container grid grid-cols-1 gap-10 pb-10 pt-14 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo size={32} ink="#F5F3F0" />
            <p className="mb-0 mt-3 max-w-[30ch] font-mono text-[11px] leading-[1.7] tracking-[0.03em]">
              Autonomous SEO, GEO and X growth for solo founders shipping fast.
            </p>
          </div>
          {footerCols.map((col) => (
            <div key={col.head} className="flex flex-col gap-3">
              <div className="font-mono text-[9px] tracking-[0.16em] text-[#8C857A]">{col.head}</div>
              {col.links.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="font-mono text-[11.5px] tracking-[0.03em] text-surface-muted hover:text-primary"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
        <div className="ds-container flex flex-wrap justify-between gap-6 border-t border-ink-rule pb-11 pt-5 font-mono text-[10px] tracking-[0.08em] text-[#8C857A]">
          <span>© 2026 SORANO.APP</span>
          <span>BUILT FOR PEOPLE WHO SHIP</span>
        </div>
      </footer>
    </main>
  );
}

function DemoBanner({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-2.5 bg-ink px-6 py-[9px] font-mono text-[11px] tracking-[0.06em] text-surface-muted">
      <span className="text-primary">[PREVIEW]</span>
      <span>Demo login to explore the full dashboard</span>
      <Link
        href="/auth/signin"
        className="text-background underline underline-offset-[3px] hover:text-primary"
      >
        → ENTER
      </Link>
    </div>
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
    <nav className="sticky top-0 z-20 border-b border-border bg-background/94 backdrop-blur-[8px]">
      <div className="ds-container flex h-auto flex-wrap items-center justify-between gap-8 py-3 lg:h-[66px] lg:py-0">
        <Link href="/" className="flex items-center gap-[9px]">
          <Logo size={32} />
          <span className="font-mono text-[9px] tracking-[0.14em] text-muted-foreground">
            SEO · GEO · X
          </span>
        </Link>
        <div className="flex flex-wrap items-center gap-x-[26px] gap-y-2.5 font-mono text-[11px] tracking-[0.08em]">
          <Link href="#platform" className="text-ink-muted hover:text-accent">
            PLATFORM
          </Link>
          <Link href="#visibility" className="text-ink-muted hover:text-accent">
            AI_VISIBILITY
          </Link>
          <Link href="#dashboard-preview" className="text-ink-muted hover:text-accent">
            DASHBOARD PREVIEW
          </Link>
          <Link href="#compare" className="text-ink-muted hover:text-accent">
            COMPARE
          </Link>
          <Link href="#pricing" className="text-ink-muted hover:text-accent">
            PRICING
          </Link>
          <Link href="#faq" className="text-ink-muted hover:text-accent">
            FAQ
          </Link>
          {signedIn ? (
            <>
              <Link href="/dashboard" className="ds-btn-ink">
                {navCta}
              </Link>
              <span className="text-muted-foreground">{userLabel}</span>
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
