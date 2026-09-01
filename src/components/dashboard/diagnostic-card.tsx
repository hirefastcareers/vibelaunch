"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw } from "lucide-react";
import { SUITE_LABELS, type DiagnosticSuite } from "@/lib/diagnostics/types";
import { StatusPill, statusLabel, statusTone } from "@/components/status-pill";

interface TestRunRecord {
  id: string;
  suite: string;
  status: string;
  score: number;
  details: Record<string, unknown>;
  executedAt: string;
}

function suiteSummary(run: TestRunRecord): string {
  const d = run.details;
  if (typeof d.summary === "string") return d.summary;
  if (typeof d.message === "string") return d.message;
  if (d.assertions && typeof d.assertions === "object") {
    const passed = Object.values(d.assertions as Record<string, boolean>).filter(Boolean).length;
    const total = Object.keys(d.assertions as object).length;
    return `${passed}/${total} indexing checks passed`;
  }
  if (typeof d.embeddingsCount === "number") {
    return `Learning from ${d.embeddingsCount} viral post(s)`;
  }
  if (typeof d.citationsFound === "number") {
    return `Cited in ${d.citationsFound} of ${d.totalQueriesChecked ?? 0} AI searches`;
  }
  return `Score: ${run.score}%`;
}

interface DiagnosticData {
  projectId?: string;
  projectName?: string;
  overallScore: number;
  overallStatus: string;
  runs: TestRunRecord[];
}

export function DiagnosticCard() {
  const [data, setData] = useState<DiagnosticData | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const fetchRuns = useCallback(async () => {
    const res = await fetch("/api/diagnostics/runs");
    if (res.ok) setData(await res.json());
  }, []);

  useEffect(() => {
    fetchRuns().finally(() => setLoading(false));
  }, [fetchRuns]);

  async function handleRunAll() {
    setRunning(true);
    try {
      const res = await fetch("/api/diagnostics/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: data?.projectId }),
      });
      if (res.ok) {
        const result = await res.json();
        setData((prev) =>
          prev
            ? {
                ...prev,
                overallScore: result.overallScore,
                overallStatus: result.overallStatus,
                runs: result.suites.map(
                  (s: {
                    suite: string;
                    status: string;
                    score: number;
                    details: Record<string, unknown>;
                  }) => ({
                    id: s.suite,
                    suite: s.suite,
                    status: s.status,
                    score: s.score,
                    details: s.details,
                    executedAt: result.executedAt,
                  })
                ),
              }
            : prev
        );
      }
    } finally {
      setRunning(false);
    }
  }

  if (loading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <p className="font-mono text-[10px] tracking-widest text-muted-foreground mb-1">
            [AUDIT]
          </p>
          <CardTitle className="text-xl">App Health Checks</CardTitle>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRunAll}
          disabled={running}
          className="font-mono text-[10px] tracking-wider"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${running ? "animate-spin" : ""}`} />
          {running ? "RUNNING..." : "RUN ALL"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-3xl tabular-nums">{data?.overallScore ?? 0}%</span>
          <StatusPill tone={statusTone(data?.overallStatus ?? "unknown")}>
            {statusLabel(data?.overallStatus ?? "unknown")}
          </StatusPill>
        </div>

        <div className="border border-border divide-y divide-border">
          {(data?.runs ?? []).map((run) => {
            const label = SUITE_LABELS[run.suite as DiagnosticSuite] ?? run.suite;
            return (
              <div key={run.id} className="flex items-start gap-3 p-3">
                <StatusPill tone={statusTone(run.status)}>{statusLabel(run.status)}</StatusPill>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm">{label}</p>
                    <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                      {run.score}%
                    </span>
                  </div>
                  <p className="font-mono text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                    {suiteSummary(run)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {!data?.runs?.length && (
          <p className="text-sm text-muted-foreground py-4">
            No health checks yet. Click &quot;Run All Checks&quot; to verify indexing, AI learning,
            media, and AI search citations.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
