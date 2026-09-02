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
      <div className="p-6 space-y-10">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-px border border-border bg-border md:grid-cols-2 lg:grid-cols-4">
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

  return (
    <div className="p-6 space-y-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] tracking-widest text-muted-foreground mb-1">
            OPS
          </p>
          <h1 className="text-4xl">Command Center</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Launch metrics and top-performing content
          </p>
        </div>
        <StatusPill tone="ok">[LEARNING ACTIVE]</StatusPill>
      </div>

      <div className="grid gap-px border border-border bg-border md:grid-cols-2 lg:grid-cols-4">
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
            <CardHeader>
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

      <div>
        <h2 className="text-2xl mb-4">Top Performing Posts</h2>
        {!data?.topPosts.length ? (
          <Card>
            <CardContent className="py-8 text-sm text-muted-foreground">
              No published posts yet.{" "}
              <Link href="/dashboard/queue" className="underline text-foreground">
                Head to the AI Post Generator
              </Link>{" "}
              to create your first post.
            </CardContent>
          </Card>
        ) : (
          <div className="border border-border divide-y divide-border">
            {data.topPosts.map((post) => (
              <div key={post.id} className="bg-card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-relaxed font-mono">{post.content}</p>
                    <div className="flex items-center gap-3 mt-3 font-mono text-[10px] text-muted-foreground">
                      <span>{post.impressions.toLocaleString()} IMP</span>
                      <span>{formatRelativeTime(post.publishedAt)}</span>
                      {post.mediaUrls.length > 0 && (
                        <StatusPill>{`[MEDIA: ${post.mediaUrls.length}]`}</StatusPill>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <EriBadge eri={post.eri} />
                    {post.xPostUrl && (
                      <a
                        href={post.xPostUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-[10px] tracking-wider underline text-muted-foreground hover:text-foreground"
                      >
                        VIEW
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
