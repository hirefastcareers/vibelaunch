"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { SUITE_LABELS, type DiagnosticSuite } from "@/lib/diagnostics/types";

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

const STATUS_ICON = {
  passed: CheckCircle2,
  warning: AlertTriangle,
  failed: XCircle,
} as const;

const STATUS_VARIANT = {
  passed: "viral",
  warning: "baseline",
  failed: "low",
} as const;

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

  const OverallIcon =
    STATUS_ICON[data?.overallStatus as keyof typeof STATUS_ICON] ?? Activity;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">App Health Checks</CardTitle>
        </div>
        <Button variant="outline" size="sm" onClick={handleRunAll} disabled={running}>
          <RefreshCw className={`h-4 w-4 ${running ? "animate-spin" : ""}`} />
          {running ? "Running…" : "Run All Checks"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center gap-3">
          <OverallIcon
            className={`h-8 w-8 ${
              data?.overallStatus === "passed"
                ? "text-emerald-400"
                : data?.overallStatus === "warning"
                  ? "text-amber-400"
                  : "text-muted-foreground"
            }`}
          />
          <div>
            <p className="text-sm text-muted-foreground">App Health Score</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{data?.overallScore ?? 0}%</span>
              <Badge
                variant={
                  STATUS_VARIANT[
                    (data?.overallStatus ?? "warning") as keyof typeof STATUS_VARIANT
                  ] ?? "outline"
                }
              >
                {data?.overallStatus ?? "unknown"}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {(data?.runs ?? []).map((run) => {
            const Icon =
              STATUS_ICON[run.status as keyof typeof STATUS_ICON] ?? Activity;
            const label =
              SUITE_LABELS[run.suite as DiagnosticSuite] ?? run.suite;
            return (
              <div
                key={run.id}
                className="flex items-start gap-2 rounded-md border border-border p-3"
              >
                <Icon
                  className={`h-4 w-4 mt-0.5 shrink-0 ${
                    run.status === "passed"
                      ? "text-emerald-400"
                      : run.status === "warning"
                        ? "text-amber-400"
                        : "text-red-400"
                  }`}
                />
                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{label}</p>
                    <span className="text-xs text-muted-foreground">{run.score}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {suiteSummary(run)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {!data?.runs?.length && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No health checks yet. Click &quot;Run All Checks&quot; to verify indexing, AI learning,
            media, and AI search citations.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
