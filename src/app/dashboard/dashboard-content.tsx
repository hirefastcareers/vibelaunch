import Link from "next/link";
import { Suspense } from "react";
import { ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EriBadge } from "@/components/eri-badge";
import { GeoCard } from "@/components/dashboard/geo-card";
import { DiagnosticCard } from "@/components/dashboard/diagnostic-card";
import { PublishArticleCard } from "@/components/dashboard/publish-article-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { NextActionBanner } from "@/components/dashboard/next-action-banner";
import { DashboardPage, PageHeader } from "@/components/dashboard-page";
import { ShipUpdateLauncher } from "@/components/ship-update-launcher";
import { displayHandle, getNextAction } from "@/lib/dashboard/next-action";
import type { DashboardStats } from "@/lib/dashboard/get-stats";
import { formatRelativeTime } from "@/lib/utils";

export default function DashboardHome({ data }: { data: DashboardStats }) {
  const stats = data.stats;
  const eriTrend = data.eriTrend;
  const showEriChart = eriTrend.length >= 2;
  const handle = displayHandle(data.user);
  const hasProjects = data.projects.length > 0;
  const nextAction = getNextAction({
    projectCount: data.projects.length,
    draftCount: stats.draftCount,
    publishedCount: stats.publishedCount,
    articleCount: stats.seoPagesPublished,
  });

  return (
    <DashboardPage>
      <PageHeader
        title="Home"
        description={handle ? `Welcome back, ${handle}` : "Your growth loop at a glance"}
        actions={
          <>
            <Button asChild variant="secondary" size="sm">
              <Link href="/dashboard/queue">View posts</Link>
            </Button>
            {hasProjects ? (
              <Suspense
                fallback={
                  <Button size="sm" disabled>
                    Ship update
                  </Button>
                }
              >
                <ShipUpdateLauncher projects={data.projects} />
              </Suspense>
            ) : (
              <Button asChild size="sm">
                <Link href="/onboard">Create project</Link>
              </Button>
            )}
          </>
        }
      />

      <NextActionBanner action={nextAction} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Impressions"
          hint="Last 7 days"
          value={(stats.impressionsVelocity ?? 0).toLocaleString()}
          trend={stats.impressionsTrend ?? undefined}
          sparkline={eriTrend.length > 1 ? eriTrend.slice(-7).map((d) => d.eri) : undefined}
        />
        <StatCard
          label="Engagement score"
          hint="Average across published posts"
          value={stats.avgEri.toFixed(1)}
          trend={stats.eriTrendPct ?? undefined}
        />
        <StatCard
          label="Articles live"
          hint="Public changelog pages"
          value={stats.seoPagesPublished}
        />
        <StatCard
          label="Posts on X"
          hint="Published from this workspace"
          value={stats.publishedCount}
        />
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <Card className="overflow-hidden bg-background lg:col-span-2">
          <CardHeader className="px-5 pb-2 pt-5">
            <p className="text-xs font-medium text-muted-foreground">Performance</p>
            <CardTitle className="mt-1 text-base font-medium">Engagement over time</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-2">
            {showEriChart ? (
              <TrendChart
                data={eriTrend}
                series={[{ key: "eri", label: "Avg score", featured: true }]}
                xKey="date"
              />
            ) : (
              <EmptyState
                title="Not enough data yet"
                description="Scores appear here after published posts collect a few days of analytics."
              />
            )}
          </CardContent>
        </Card>

        <DiagnosticCard />
      </div>

      <BestPosts posts={data.topPosts} />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <div id="ai-search" className="scroll-mt-8">
          <GeoCard />
        </div>
        <div id="articles" className="scroll-mt-8">
          <PublishArticleCard projects={data.projects} />
        </div>
      </div>
    </DashboardPage>
  );
}

function BestPosts({
  posts,
}: {
  posts: DashboardStats["topPosts"];
}) {
  return (
    <section>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-medium text-foreground">Best posts</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Highest engagement from published posts
          </p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/queue">View all</Link>
        </Button>
      </div>

      {!posts.length ? (
        <div className="rounded-xl border border-border bg-background px-5 py-10 text-center shadow-sm">
          <p className="text-sm font-medium text-foreground">No published posts yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate a draft, then publish it to X to start filling this list.
          </p>
          <Button asChild size="sm" className="mt-4">
            <Link href="/dashboard/queue?generate=true">Generate a post</Link>
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
          <ul className="divide-y divide-border">
            {posts.map((post) => (
              <li key={post.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                <p className="min-w-0 flex-1 text-sm leading-relaxed text-foreground line-clamp-2">
                  {post.content}
                </p>
                <div className="flex shrink-0 flex-wrap items-center gap-3 text-sm">
                  <EriBadge eri={post.eri} />
                  <span className="tabular-nums text-muted-foreground">
                    {post.impressions.toLocaleString()} views
                  </span>
                  <span className="text-muted-foreground">{formatRelativeTime(post.publishedAt)}</span>
                  {post.xPostUrl ? (
                    <a
                      href={post.xPostUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                    >
                      View
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg bg-muted/40 px-4 py-10 text-center">
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
