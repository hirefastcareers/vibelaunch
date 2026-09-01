"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EriBadge } from "@/components/eri-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/status-pill";
import { formatRelativeTime } from "@/lib/utils";
import { GeoCard } from "@/components/dashboard/geo-card";
import { DiagnosticCard } from "@/components/dashboard/diagnostic-card";

interface DashboardStats {
  stats: {
    impressionsVelocity: number;
    avgEri: number;
    seoPagesPublished: number;
    totalImpressions: number;
    publishedCount: number;
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
  followerGrowth: Array<{ date: string; followers: number; eri: number }>;
}

function Metric({
  code,
  value,
  hint,
  id,
}: {
  code: string;
  value: string | number;
  hint: string;
  id?: string;
}) {
  return (
    <div id={id} className={`bg-card p-4 ${id ? "scroll-mt-8" : ""}`}>
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {code}
      </p>
      <div className="font-mono text-2xl tabular-nums mt-3">{value}</div>
      <p className="font-mono text-[10px] text-muted-foreground mt-2">{hint}</p>
    </div>
  );
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
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-px bg-border md:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-none" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const stats = data?.stats;

  return (
    <div className="p-6 space-y-8">
      <div>
        <p className="font-mono text-[10px] tracking-widest text-muted-foreground mb-1">
          [OPS]
        </p>
        <h1 className="text-4xl">Command Center</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Launch metrics and top-performing content
        </p>
      </div>

      <div className="grid gap-px bg-border border border-border md:grid-cols-2 lg:grid-cols-5">
        <Metric
          code="IMP_7D"
          value={(stats?.impressionsVelocity ?? 0).toLocaleString()}
          hint="Impressions, last 7 days"
        />
        <Metric
          code="VIRALITY"
          value={stats?.avgEri ?? 0}
          hint={`Across ${stats?.publishedCount ?? 0} published posts`}
        />
        <Metric
          id="articles"
          code="INDEXED"
          value={stats?.seoPagesPublished ?? 0}
          hint="Articles on Google"
        />
        <Metric
          code="IMP_ALL"
          value={(stats?.totalImpressions ?? 0).toLocaleString()}
          hint="Impressions, all time"
        />
        <Metric code="LEARN" value="ACTIVE" hint="Learning from viral posts" />
      </div>

      <div id="ai-search" className="scroll-mt-8">
        <GeoCard />
      </div>

      <DiagnosticCard />

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Follower Growth Trajectory</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data?.followerGrowth ?? []}>
              <CartesianGrid strokeDasharray="1 4" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                fontFamily="var(--font-mono)"
                tickFormatter={(v) => v.slice(5)}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                fontFamily="var(--font-mono)"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "2px",
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="followers"
                stroke="hsl(var(--primary))"
                strokeWidth={1.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

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
