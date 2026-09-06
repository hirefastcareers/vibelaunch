"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw } from "lucide-react";
import { StatusPill } from "@/components/status-pill";
import { StatCard } from "@/components/dashboard/stat-card";
import { TrendChart } from "@/components/dashboard/trend-chart";

interface ProviderStats {
  cited: number;
  total: number;
  label: string;
}

interface GeoData {
  projectId?: string;
  projectName?: string;
  citationScore: number;
  byProvider: Record<string, ProviderStats>;
  suggestions: string[];
  citationTrend: Array<{ date: string; [key: string]: number | string }>;
}

const PROVIDER_KEYS = ["perplexity", "chatgpt", "claude"] as const;
const PROVIDER_LABELS: Record<(typeof PROVIDER_KEYS)[number], string> = {
  perplexity: "Perplexity",
  chatgpt: "ChatGPT",
  claude: "Claude",
};

/** Feature the leader only when it is clearly ahead. Within 5pts, show all comparison-tone. */
function featuredProvider(byProvider: GeoData["byProvider"] | undefined): string | null {
  if (!byProvider) return null;

  const ranked = PROVIDER_KEYS.map((key) => {
    const provider = byProvider[key];
    if (!provider || provider.total <= 0) return null;
    return { key, rate: (provider.cited / provider.total) * 100 };
  }).filter((row): row is { key: (typeof PROVIDER_KEYS)[number]; rate: number } => row != null);

  if (ranked.length === 0) return null;
  ranked.sort((a, b) => b.rate - a.rate);
  const [top, next] = ranked;
  if (next != null && top.rate - next.rate < 5) return null;
  return top.key;
}

export function GeoCard() {
  const [data, setData] = useState<GeoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  const fetchMetrics = useCallback(async () => {
    const res = await fetch("/api/geo/metrics");
    if (res.ok) setData(await res.json());
  }, []);

  useEffect(() => {
    fetchMetrics().finally(() => setLoading(false));
  }, [fetchMetrics]);

  async function handleRecheck() {
    setChecking(true);
    try {
      const res = await fetch("/api/geo/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: data?.projectId }),
      });
      if (res.ok) setData(await res.json());
    } finally {
      setChecking(false);
    }
  }

  if (loading) {
    return <Skeleton className="h-72 w-full rounded-xl" />;
  }

  const citationTrend = data?.citationTrend ?? [];
  const showCitationChart = citationTrend.length >= 2;
  const featured = featuredProvider(data?.byProvider);
  const suggestions = data?.suggestions ?? [];

  return (
    <Card className="bg-background">
      <CardHeader className="flex flex-row items-start justify-between gap-3 px-5 pb-2 pt-5">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Visibility</p>
          <CardTitle className="mt-1 text-base font-medium">AI search</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            How often ChatGPT, Perplexity, and Claude recommend {data?.projectName ?? "you"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRecheck} disabled={checking}>
          <RefreshCw className={`h-3.5 w-3.5 ${checking ? "animate-spin" : ""}`} />
          {checking ? "Checking" : "Recheck"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-6 px-5 pb-5 pt-3">
        <StatCard
          label="Cited"
          hint="Niche prompts where you are recommended"
          value={`${data?.citationScore ?? 0}%`}
        />

        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">Providers</p>
          <div className="flex flex-wrap gap-2">
            {PROVIDER_KEYS.map((key) => {
              const provider = data?.byProvider?.[key];
              const active = provider && provider.cited > 0;
              return (
                <StatusPill key={key} tone={active ? "ok" : "neutral"}>
                  {provider?.label ?? PROVIDER_LABELS[key]}
                  {provider && provider.total > 0 ? ` ${provider.cited}/${provider.total}` : ""}
                </StatusPill>
              );
            })}
          </div>
        </div>

        {showCitationChart ? (
          <TrendChart
            data={citationTrend}
            series={PROVIDER_KEYS.map((key) => ({
              key,
              label: PROVIDER_LABELS[key],
              featured: featured === key,
            }))}
            xKey="date"
          />
        ) : (
          <div className="rounded-lg bg-muted/40 px-4 py-6">
            <p className="text-sm font-medium text-foreground">Not enough data yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Citation trend builds as weekly sweeps run. Check back after a few cycles.
            </p>
          </div>
        )}

        {suggestions.length > 0 ? (
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Ways to improve</p>
            <ul className="space-y-2">
              {suggestions.map((suggestion, i) => (
                <li
                  key={i}
                  className="border-l-2 border-primary/30 pl-3 text-sm leading-relaxed text-muted-foreground"
                >
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
