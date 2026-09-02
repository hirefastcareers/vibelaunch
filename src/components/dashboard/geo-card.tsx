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

/** Feature the leader only when it is clearly ahead — within 5pts, show all comparison-tone. */
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
    return <Skeleton className="h-72 w-full" />;
  }

  const citationTrend = data?.citationTrend ?? [];
  const showCitationChart = citationTrend.length >= 2;
  const featured = featuredProvider(data?.byProvider);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <p className="font-mono text-[10px] tracking-widest text-muted-foreground mb-1">
            [AI_SEARCH]
          </p>
          <CardTitle className="text-xl">AI Search (ChatGPT/Perplexity)</CardTitle>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRecheck}
          disabled={checking}
          className="font-mono text-[10px] tracking-wider"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${checking ? "animate-spin" : ""}`} />
          {checking ? "CHECKING..." : "RECHECK"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <StatCard label="CITED" value={`${data?.citationScore ?? 0}%`} />
          <p className="text-xs text-muted-foreground mt-2">
            Niche AI prompts where {data?.projectName ?? "your product"} is recommended
          </p>
        </div>

        <div>
          <p className="font-mono text-[10px] tracking-widest text-muted-foreground mb-3">
            PROVIDERS
          </p>
          <div className="flex flex-wrap gap-2">
            {PROVIDER_KEYS.map((key) => {
              const provider = data?.byProvider[key];
              const active = provider && provider.cited > 0;
              return (
                <StatusPill key={key} tone={active ? "ok" : "neutral"}>
                  {active ? "[OK]" : "[--]"} {provider?.label ?? key}
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
          <div>
            <p className="font-mono text-[10px] tracking-widest text-muted-foreground mb-1">
              [EMPTY]
            </p>
            <h2 className="text-2xl">Not enough data yet</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Citation trend builds up as weekly sweeps run — check back after a few cycles.
            </p>
          </div>
        )}

        <div>
          <p className="font-mono text-[10px] tracking-widest text-muted-foreground mb-3">
            TWEAKS
          </p>
          <ul className="space-y-2">
            {(data?.suggestions ?? []).map((suggestion, i) => (
              <li
                key={i}
                className="text-sm text-muted-foreground leading-relaxed pl-3 border-l border-border"
              >
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
