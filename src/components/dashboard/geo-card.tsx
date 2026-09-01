"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw } from "lucide-react";
import { StatusPill } from "@/components/status-pill";

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
}

const PROVIDER_KEYS = ["perplexity", "chatgpt", "claude"] as const;

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

  const strong = (data?.citationScore ?? 0) >= 50;

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
          <p className="font-mono text-[10px] tracking-widest text-muted-foreground mb-1">
            CITED
          </p>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-4xl tabular-nums">{data?.citationScore ?? 0}%</span>
            <StatusPill tone={strong ? "ok" : "warn"}>
              {strong ? "[STRONG]" : "[GROWING]"}
            </StatusPill>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
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
