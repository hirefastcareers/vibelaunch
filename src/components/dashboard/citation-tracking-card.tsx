"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatCard } from "@/components/dashboard/stat-card";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { DataPill } from "@/components/ui/data-pill";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";

type DashboardRow = {
  model: string;
  label: string;
  mentionRate: number;
  mentioned: number;
  total: number;
  recentCitedUrls: string[];
};

type DashboardPayload = {
  demo: boolean;
  brandName: string | null;
  trackedQueries: Array<{
    id: string;
    brandName: string;
    promptText: string;
    active: boolean;
  }>;
  rows: DashboardRow[];
  trend: Array<{
    date: string;
    openai: number;
    anthropic: number;
    gemini: number;
    perplexity: number;
    grok: number;
  }>;
  mentionTrend: Array<{ date: string; mentionRate: number }>;
  recentUrls: string[];
  note: string;
};

type ViewMode = "share" | "trend" | "urls";

export function CitationTrackingCard({
  demoMode,
  defaultBrand = "",
}: {
  demoMode: boolean;
  defaultBrand?: string;
}) {
  const [brandName, setBrandName] = useState(defaultBrand);
  const [queriesText, setQueriesText] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("share");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/geo/citation-share");
      const json = (await res.json()) as DashboardPayload & { error?: string };
      if (!res.ok) {
        setError(json.error ?? "Failed to load citation data");
        setData(null);
        return;
      }
      setData(json);
      if (json.brandName) setBrandName((prev) => prev || json.brandName || "");
    } catch {
      setError("Could not load citation tracking");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const prompts = queriesText
      .split(/[\n,]/)
      .map((q) => q.trim())
      .filter(Boolean);

    if (!brandName.trim() || prompts.length === 0) {
      setError("Brand name and at least one query are required");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/geo/tracked-queries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName: brandName.trim(),
          prompts,
          runNow: !demoMode,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to save tracked queries");
        return;
      }
      setQueriesText("");
      await loadDashboard();
    } catch {
      setError("Failed to save tracked queries");
    } finally {
      setSaving(false);
    }
  }

  const featured =
    data?.rows.reduce<DashboardRow | null>(
      (best, row) =>
        !best || row.mentionRate > best.mentionRate ? row : best,
      null
    ) ?? null;

  const hasLiveRows = Boolean(
    data && !data.demo && data.rows.some((r) => r.total > 0)
  );
  const showDemo = Boolean(data?.demo);
  const showEmptyLive = Boolean(data && !data.demo && !hasLiveRows);

  return (
    <Card className="bg-background" id="ai-citation-tracking">
      <CardHeader className="px-5 pb-2 pt-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground">GEO</p>
            <CardTitle className="mt-1 text-base font-medium">
              AI Citation Tracking
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Track whether ChatGPT, Perplexity, Claude, and Gemini mention your
              brand for queries you care about.
            </p>
          </div>
          {showDemo ? (
            <DataPill tone="soft">Demo stub</DataPill>
          ) : hasLiveRows ? (
            <DataPill tone="soft">Live runs</DataPill>
          ) : (
            <DataPill tone="outline">Awaiting first sweep</DataPill>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6 px-5 pb-5 pt-3">
        <form onSubmit={handleSave} className="space-y-4">
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
            <p className="text-xs text-muted-foreground">
              One query per line. Saves as TrackedQuery rows
              {demoMode
                ? " (demo mode will not call paid model APIs)."
                : " and queues a live 4-model sweep."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="sm" disabled={saving || !brandName.trim()}>
              {saving ? "Saving…" : "Save tracked queries"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={loading}
              onClick={() => void loadDashboard()}
            >
              {loading ? "Refreshing…" : "Refresh"}
            </Button>
          </div>
        </form>

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {data?.trackedQueries?.length ? (
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Saved queries
            </p>
            <ul className="space-y-1.5">
              {data.trackedQueries.slice(0, 6).map((q) => (
                <li key={q.id} className="truncate text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{q.brandName}</span>
                  {" — "}
                  {q.promptText}
                  {!q.active ? " (paused)" : ""}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {showEmptyLive ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6">
            <p className="text-sm font-medium text-foreground">
              No live citation runs yet
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{data?.note}</p>
          </div>
        ) : null}

        {(showDemo || hasLiveRows) && data ? (
          <div className="space-y-5">
            <p className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-muted-foreground">
              {data.note}
            </p>

            <SegmentedTabs
              options={[
                { value: "share", label: "Share" },
                { value: "trend", label: "Trend" },
                { value: "urls", label: "URLs" },
              ]}
              value={view}
              onChange={(v) => setView(v as ViewMode)}
            />

            {view === "share" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {data.rows.map((row) => (
                  <StatCard
                    key={row.model}
                    label={row.label}
                    hint={
                      row.total > 0
                        ? `${row.mentioned}/${row.total} runs mentioned`
                        : "No runs yet"
                    }
                    value={`${row.mentionRate}%`}
                  />
                ))}
              </div>
            ) : null}

            {view === "trend" ? (
              data.trend.length >= 2 ? (
                <TrendChart
                  data={data.trend}
                  series={[
                    {
                      key: "openai",
                      label: "ChatGPT",
                      featured: featured?.model === "openai",
                    },
                    {
                      key: "perplexity",
                      label: "Perplexity",
                      featured: featured?.model === "perplexity",
                    },
                    {
                      key: "anthropic",
                      label: "Claude",
                      featured: featured?.model === "anthropic",
                    },
                    {
                      key: "gemini",
                      label: "Gemini",
                      featured: featured?.model === "gemini",
                    },
                    {
                      key: "grok",
                      label: "Grok",
                      featured: featured?.model === "grok",
                    },
                  ]}
                  xKey="date"
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Trend needs at least two weekly buckets of live runs.
                </p>
              )
            ) : null}

            {view === "urls" ? (
              data.recentUrls.length > 0 ? (
                <ul className="space-y-2">
                  {data.recentUrls.map((url) => (
                    <li key={url}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all text-sm text-primary hover:underline"
                      >
                        {url}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No cited URLs captured yet
                  {showDemo ? " (demo stub has none)." : "."}
                </p>
              )
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
