"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EriBadge } from "@/components/eri-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/status-pill";
import { formatRelativeTime } from "@/lib/utils";
import { GeoCard } from "@/components/dashboard/geo-card";
import { DiagnosticCard } from "@/components/dashboard/diagnostic-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { Button } from "@/components/ui/button";

interface DashboardStats {
  stats: {
    impressionsVelocity: number;
    avgEri: number;
    seoPagesPublished: number;
    totalImpressions: number;
    publishedCount: number;
    postCount?: number;
    impressionsTrend: number | null;
    eriTrendPct: number | null;
  };
  topPosts: Array<{
    id: string;
    content: string;
    eri: number;
    impressions: number;
    publishedAt: string | null;
    xPostUrl: string | null;
    mediaUrls: string[];
  }>;
  eriTrend: Array<{ date: string; eri: number }>;
}

export default function CommandCenterPage() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-10">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-none" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <Skeleton className="h-72 lg:col-span-2" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  const stats = data?.stats;
  const eriTrend = data?.eriTrend ?? [];
  const showEriChart = eriTrend.length >= 2;
  const hasPublishedPosts = (data?.topPosts.length ?? 0) > 0;
  const hasArticles = (stats?.seoPagesPublished ?? 0) > 0;

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="font-mono text-[10px] tracking-widest text-muted-foreground mb-1">
            OPS
          </p>
          <h1 className="text-5xl">Command Center</h1>
          <p className="mt-1 max-w-[56ch] text-sm text-muted-foreground">
            The fastest read on whether your product is shipping, publishing, learning, and getting cited.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <StatusPill tone={hasPublishedPosts ? "ok" : "neutral"}>
            {hasPublishedPosts ? "[LEARNING ACTIVE]" : "[SETUP NEEDED]"}
          </StatusPill>
          <Button asChild className="font-mono text-xs tracking-wider">
            <Link href="/dashboard/queue?generate=true">GENERATE POST</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
        <Card>
          <CardHeader className="border-b border-border pb-4">
            <p className="font-mono text-[10px] tracking-widest text-muted-foreground">
              THIS WEEK
            </p>
            <CardTitle className="mt-1 text-[24px] leading-tight">
              What needs attention next
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-px p-0 md:grid-cols-3">
            <div className="bg-background px-5 py-5">
              <p className="font-mono text-[10px] tracking-widest text-muted-foreground">01</p>
              <h2 className="mt-2 text-[21px]">Create drafts</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {hasPublishedPosts
                  ? "Top posts are flowing. Keep the queue fed with fresh hooks."
                  : "You do not have published posts yet. Start by generating your first draft."}
              </p>
            </div>
            <div className="bg-card px-5 py-5">
              <p className="font-mono text-[10px] tracking-widest text-muted-foreground">02</p>
              <h2 className="mt-2 text-[21px]">Publish SEO</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {hasArticles
                  ? "Indexed changelog pages are live. Add the next product update when you ship."
                  : "No articles are indexed yet. Publish a changelog entry to start earning search coverage."}
              </p>
            </div>
            <div className="bg-background px-5 py-5">
              <p className="font-mono text-[10px] tracking-widest text-muted-foreground">03</p>
              <h2 className="mt-2 text-[21px]">Run checks</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Diagnostics and citation sweeps turn the dashboard into a feedback loop instead of a report.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border pb-4">
            <p className="font-mono text-[10px] tracking-widest text-muted-foreground">
              QUICK LINKS
            </p>
            <CardTitle className="mt-1 text-[24px] leading-tight">
              Move the loop forward
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <Link
              href="/onboard"
              className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3 text-sm hover:bg-secondary"
            >
              <span>Onboard or refresh a project</span>
              <span className="font-mono text-[10px] tracking-widest text-muted-foreground">SETUP</span>
            </Link>
            <Link
              href="/dashboard/queue"
              className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3 text-sm hover:bg-secondary"
            >
              <span>Open queue and review pending posts</span>
              <span className="font-mono text-[10px] tracking-widest text-muted-foreground">QUEUE</span>
            </Link>
            <Link
              href="/dashboard/diagnostics"
              className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3 text-sm hover:bg-secondary"
            >
              <span>Run a health audit</span>
              <span className="font-mono text-[10px] tracking-widest text-muted-foreground">AUDIT</span>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="IMP_7D"
          value={(stats?.impressionsVelocity ?? 0).toLocaleString()}
          trend={stats?.impressionsTrend ?? undefined}
          className="rounded-none border-0"
        />
        <StatCard
          label="VIRALITY"
          value={stats?.avgEri ?? 0}
          trend={stats?.eriTrendPct ?? undefined}
          className="rounded-none border-0"
        />
        <StatCard
          id="articles"
          label="INDEXED"
          value={stats?.seoPagesPublished ?? 0}
          className="scroll-mt-8 rounded-none border-0"
        />
        <StatCard
          label="IMP_ALL"
          value={(stats?.totalImpressions ?? 0).toLocaleString()}
          className="rounded-none border-0"
        />
      </div>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
        <div className="min-w-0 space-y-8 lg:col-span-2">
          <Card>
            <CardHeader className="border-b border-border pb-4">
              <p className="font-mono text-[10px] tracking-widest text-muted-foreground mb-1">
                ERI
              </p>
              <CardTitle className="text-xl">ERI Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {showEriChart ? (
                <TrendChart
                  data={eriTrend}
                  series={[{ key: "eri", label: "Avg ERI", featured: true }]}
                  xKey="date"
                />
              ) : (
                <div>
                  <p className="font-mono text-[10px] tracking-widest text-muted-foreground mb-1">
                    EMPTY
                  </p>
                  <h2 className="text-2xl">Not enough data yet</h2>
                  <p className="text-muted-foreground mt-1 text-sm">
                    ERI snapshots build up as the analytics cron runs against published posts.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div id="ai-search" className="scroll-mt-8">
            <GeoCard />
          </div>
        </div>

        <div className="min-w-0">
          <DiagnosticCard />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[10px] tracking-widest text-muted-foreground">CONTENT</p>
            <h2 className="mt-1 text-2xl">Top performing posts</h2>
          </div>
          <p className="font-mono text-[11px] tracking-[0.06em] text-muted-foreground">
            {stats?.publishedCount ?? 0} published · {stats?.postCount ?? 0} total drafts and posts
          </p>
        </div>
        {!data?.topPosts.length ? (
          <Card>
            <CardContent className="space-y-4 py-8">
              <div>
                <p className="font-mono text-[10px] tracking-widest text-muted-foreground">EMPTY</p>
                <h3 className="mt-2 text-[24px]">No winners yet</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Publish a few posts and this table will surface the hooks and media formats that actually work.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild className="font-mono text-xs tracking-wider">
                  <Link href="/dashboard/queue?generate=true">GENERATE FIRST POST</Link>
                </Button>
                <Button asChild variant="outline" className="font-mono text-xs tracking-wider">
                  <Link href="/onboard">ONBOARD A PROJECT</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            <div className="hidden grid-cols-[minmax(0,1fr)_88px_88px_96px] gap-px border-b border-border bg-border px-0 md:grid">
              <div className="bg-ink px-4 py-3 font-mono text-[10px] tracking-[0.14em] text-[#8C857A]">
                POST
              </div>
              <div className="bg-ink px-4 py-3 text-right font-mono text-[10px] tracking-[0.14em] text-[#8C857A]">
                ERI
              </div>
              <div className="bg-ink px-4 py-3 text-right font-mono text-[10px] tracking-[0.14em] text-[#8C857A]">
                IMP
              </div>
              <div className="bg-ink px-4 py-3 text-right font-mono text-[10px] tracking-[0.14em] text-[#8C857A]">
                LINK
              </div>
            </div>
            {data.topPosts.map((post) => (
              <div
                key={post.id}
                className="grid gap-4 border-b border-border bg-card p-4 last:border-b-0 md:grid-cols-[minmax(0,1fr)_88px_88px_96px] md:items-start"
              >
                <div className="min-w-0">
                  <p className="text-sm leading-relaxed font-mono">{post.content}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 font-mono text-[10px] text-muted-foreground">
                    <span>{formatRelativeTime(post.publishedAt)}</span>
                    {post.mediaUrls.length > 0 && (
                      <StatusPill>{`[MEDIA ${post.mediaUrls.length}]`}</StatusPill>
                    )}
                  </div>
                </div>
                <div className="md:justify-self-end">
                  <EriBadge eri={post.eri} />
                </div>
                <div className="font-mono text-sm text-foreground md:justify-self-end">
                  {post.impressions.toLocaleString()}
                </div>
                <div className="md:justify-self-end">
                  {post.xPostUrl && (
                    <a
                      href={post.xPostUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[10px] tracking-wider underline text-muted-foreground hover:text-foreground"
                    >
                      VIEW POST
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
