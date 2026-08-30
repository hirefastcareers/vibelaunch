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
import { Badge } from "@/components/ui/badge";
import { Eye, TrendingUp, FileText, Users, ExternalLink } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { GeoCard } from "@/components/dashboard/geo-card";

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
      <div className="p-8 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const stats = data?.stats;

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Command Center</h1>
        <p className="text-muted-foreground mt-1">
          Real-time launch metrics and top-performing content
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Impressions Velocity
            </CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.impressionsVelocity.toLocaleString() ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average ERI Score
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.avgEri ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {stats?.publishedCount ?? 0} published posts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              SEO Pages Published
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.seoPagesPublished ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Static changelog pages</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Impressions
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalImpressions.toLocaleString() ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>
      </div>

      <GeoCard />

      <Card>
        <CardHeader>
          <CardTitle>Follower Growth Trajectory</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data?.followerGrowth ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(v) => v.slice(5)}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Line
                type="monotone"
                dataKey="followers"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-xl font-semibold mb-4">Top Performing Posts</h2>
        {!data?.topPosts.length ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No published posts yet.{" "}
              <Link href="/dashboard/queue" className="text-primary hover:underline">
                Head to Queue Studio
              </Link>{" "}
              to create your first post.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {data.topPosts.map((post) => (
              <Card key={post.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-relaxed">{post.content}</p>
                      <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                        <span>{post.impressions.toLocaleString()} impressions</span>
                        <span>{formatRelativeTime(post.publishedAt)}</span>
                        {post.mediaUrls.length > 0 && (
                          <Badge variant="secondary">{post.mediaUrls.length} media</Badge>
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
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          View <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
