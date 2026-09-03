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

interface DashboardStats {
  stats: {
    impressionsVelocity: number;
    avgEri: number;
    seoPagesPublished: number;
    totalImpressions: number;
    publishedCount: number;
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
      <div className="space-y-8 p-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-80 rounded-xl lg:col-span-2" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  const stats = data?.stats;
  const eriTrend = data?.eriTrend ?? [];
  const showEriChart = eriTrend.length >= 2;

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="ds-kicker">OPS</span>
          <h1 className="mt-1 text-[36px] md:text-[44px]">Command Center</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Launch metrics and top-performing content
          </p>
        </div>
        <StatusPill tone="ok">[LEARNING ACTIVE]</StatusPill>
      </div>

      {/* KPI Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="IMP 7D"
          value={(stats?.impressionsVelocity ?? 0).toLocaleString()}
          trend={stats?.impressionsTrend ?? undefined}
          sparkline={eriTrend.length > 1 ? eriTrend.slice(-7).map((d) => d.eri) : undefined}
        />
        <StatCard
          label="VIRALITY (ERI)"
          value={stats?.avgEri ?? 0}
          trend={stats?.eriTrendPct ?? undefined}
        />
        <StatCard
          id="articles"
          label="INDEXED PAGES"
          value={stats?.seoPagesPublished ?? 0}
        />
        <StatCard
          label="TOTAL IMP"
          value={(stats?.totalImpressions ?? 0).toLocaleString()}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <Card className="overflow-hidden rounded-xl shadow-sm">
            <CardHeader className="border-b border-border bg-muted/30">
              <div>
                <span className="ds-kicker">ENGAGEMENT</span>
                <CardTitle className="mt-1 text-xl">ERI Trend</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {showEriChart ? (
                <TrendChart
                  data={eriTrend}
                  series={[{ key: "eri", label: "Avg ERI", featured: true }]}
                  xKey="date"
                />
              ) : (
                <EmptyState
                  title="Not enough data yet"
                  description="ERI snapshots build up as the analytics cron runs against published posts."
                />
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

      {/* Top Posts Table */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl">Top Performing Posts</h2>
          <Link
            href="/dashboard/queue"
            className="ds-btn-secondary px-4 py-2 text-[11px]"
          >
            CREATE POST
          </Link>
        </div>
        {!data?.topPosts.length ? (
          <Card className="rounded-xl shadow-sm">
            <CardContent className="py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No published posts yet.{" "}
                <Link href="/dashboard/queue" className="font-medium text-primary hover:underline">
                  Generate your first post
                </Link>
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="ds-table">
              <thead>
                <tr>
                  <th>Post</th>
                  <th className="w-[100px] text-center">ERI</th>
                  <th className="w-[120px] text-right">Impressions</th>
                  <th className="w-[100px] text-right">Published</th>
                  <th className="w-[80px] text-center">Media</th>
                  <th className="w-[60px]" />
                </tr>
              </thead>
              <tbody>
                {data.topPosts.map((post) => (
                  <tr key={post.id}>
                    <td>
                      <p className="max-w-md truncate text-sm">{post.content}</p>
                    </td>
                    <td className="text-center">
                      <EriBadge eri={post.eri} />
                    </td>
                    <td className="text-right font-mono text-sm tabular-nums">
                      {post.impressions.toLocaleString()}
                    </td>
                    <td className="text-right font-mono text-[11px] text-muted-foreground">
                      {formatRelativeTime(post.publishedAt)}
                    </td>
                    <td className="text-center">
                      {post.mediaUrls.length > 0 && (
                        <StatusPill>{`[${post.mediaUrls.length}]`}</StatusPill>
                      )}
                    </td>
                    <td>
                      {post.xPostUrl && (
                        <a
                          href={post.xPostUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-[10px] tracking-wider text-primary hover:underline"
                        >
                          VIEW
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="py-8 text-center">
      <h3 className="text-xl">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
