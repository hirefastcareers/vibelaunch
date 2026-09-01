"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bot, RefreshCw, Sparkles, CheckCircle2, XCircle } from "lucide-react";

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

  const scoreVariant =
    (data?.citationScore ?? 0) >= 50
      ? "viral"
      : (data?.citationScore ?? 0) >= 25
        ? "solid"
        : "baseline";

  return (
    <Card className="border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">AI Search (ChatGPT/Perplexity)</CardTitle>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRecheck}
          disabled={checking}
        >
          <RefreshCw className={`h-4 w-4 ${checking ? "animate-spin" : ""}`} />
          {checking ? "Checking…" : "Recheck"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-end gap-3">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Cited in AI Searches</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">{data?.citationScore ?? 0}%</span>
              <Badge variant={scoreVariant}>
                {(data?.citationScore ?? 0) >= 50 ? "Strong" : "Growing"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Niche AI prompts where {data?.projectName ?? "your product"} is recommended
            </p>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-3">Where you&apos;re cited</p>
          <div className="flex flex-wrap gap-2">
            {PROVIDER_KEYS.map((key) => {
              const provider = data?.byProvider[key];
              const active = provider && provider.cited > 0;
              return (
                <Badge
                  key={key}
                  variant={active ? "viral" : "outline"}
                  className="gap-1.5 py-1 px-3"
                >
                  {active ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <XCircle className="h-3 w-3 opacity-50" />
                  )}
                  {provider?.label ?? key}
                  {provider && provider.total > 0 && (
                    <span className="opacity-70">
                      {provider.cited}/{provider.total}
                    </span>
                  )}
                </Badge>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <p className="text-sm font-medium">Recommended tweaks to get cited more</p>
          </div>
          <ul className="space-y-2">
            {(data?.suggestions ?? []).map((suggestion, i) => (
              <li
                key={i}
                className="text-sm text-muted-foreground leading-relaxed pl-3 border-l-2 border-primary/30"
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
