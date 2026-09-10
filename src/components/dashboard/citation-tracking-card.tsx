"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatCard } from "@/components/dashboard/stat-card";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { DataPill } from "@/components/ui/data-pill";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import {
  CITATION_SHARE_LABELS,
  CITATION_SHARE_PROVIDERS,
  type CitationShareRow,
} from "@/lib/geo/citation-share-demo";

type CitationShareResponse = {
  demo: boolean;
  brandName: string;
  trackedQueries: string[];
  rows: CitationShareRow[];
  trend: Array<{ date: string; chatgpt: number; perplexity: number; claude: number; gemini: number }>;
  note: string;
  error?: string;
};

type ViewMode = "share" | "trend";

export function CitationTrackingCard({
  demoMode,
  defaultBrand = "",
}: {
  /** Server-evaluated isDemoMode() — client cannot invent live data. */
  demoMode: boolean;
  defaultBrand?: string;
}) {
  const [brandName, setBrandName] = useState(defaultBrand);
  const [queriesText, setQueriesText] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CitationShareResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("share");

  async function handleTrack(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/geo/citation-share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName,
          trackedQueries: queriesText,
        }),
      });
      const json = (await res.json()) as CitationShareResponse;
      if (!res.ok) {
        setError(json.error ?? "Request failed");
        setData(null);
        return;
      }
      setData(json);
    } catch {
      setError("Could not load citation share");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  const featured =
    data?.rows.reduce<CitationShareRow | null>(
      (best, row) => (!best || row.citationShare > best.citationShare ? row : best),
      null
    ) ?? null;

  return (
    <Card className="bg-background" id="ai-citation-tracking">
      <CardHeader className="px-5 pb-2 pt-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground">GEO</p>
            <CardTitle className="mt-1 text-base font-medium">AI Citation Tracking</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Track brand mentions across ChatGPT, Perplexity, Claude, and Gemini for queries you care about.
            </p>
          </div>
          {demoMode ? (
            <DataPill tone="soft">Demo stub</DataPill>
          ) : (
            <DataPill tone="outline">Live wiring pending</DataPill>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6 px-5 pb-5 pt-3">
        <form onSubmit={handleTrack} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="citation-brand">Brand name</Label>
            <Input
              id="citation-brand"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="Acme"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="citation-queries">Tracked queries / topics</Label>
            <textarea
              id="citation-queries"
              value={queriesText}
              onChange={(e) => setQueriesText(e.target.value)}
              placeholder={"best CRM for indie founders\nGEO tools for SaaS"}
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="text-xs text-muted-foreground">One query per line, or comma-separated.</p>
          </div>
          <Button type="submit" size="sm" disabled={loading || !brandName.trim()}>
            {loading ? "Checking…" : demoMode ? "Run demo check" : "Check availability"}
          </Button>
        </form>

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {data && !data.demo ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6">
            <p className="text-sm font-medium text-foreground">No live citation-share yet</p>
            <p className="mt-1 text-sm text-muted-foreground">{data.note}</p>
          </div>
        ) : null}

        {data?.demo && data.rows.length > 0 ? (
          <div className="space-y-5">
            <p className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-muted-foreground">
              {data.note}
            </p>

            <SegmentedTabs
              options={[
                { value: "share", label: "Share" },
                { value: "trend", label: "Trend" },
              ]}
              value={view}
              onChange={(v) => setView(v as ViewMode)}
            />

            {view === "share" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {data.rows.map((row) => (
                  <StatCard
                    key={row.provider}
                    label={row.label}
                    hint={`${row.citedQueries}/${row.totalQueries} queries cited`}
                    value={`${row.citationShare}%`}
                    trend={
                      row.trend === "up" ? 4 : row.trend === "down" ? -3 : undefined
                    }
                  />
                ))}
              </div>
            ) : (
              <TrendChart
                data={data.trend}
                series={CITATION_SHARE_PROVIDERS.map((key) => ({
                  key,
                  label: CITATION_SHARE_LABELS[key],
                  featured: featured?.provider === key,
                }))}
                xKey="date"
              />
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
