"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw } from "lucide-react";
import { SUITE_LABELS, SUITE_DESCRIPTIONS, type DiagnosticSuite } from "@/lib/diagnostics/types";
import { StatusPill, statusLabel, statusTone } from "@/components/status-pill";

interface TestResult {
  suite: DiagnosticSuite;
  status: "passed" | "failed" | "warning";
  score: number;
  details: Record<string, unknown>;
}

interface DiagnosticReport {
  overallScore: number;
  overallStatus: "passed" | "failed" | "warning";
  results: TestResult[];
  timestamp?: string;
  projectId?: string;
}

export default function DiagnosticsPage() {
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState<DiagnosticReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadRuns = useCallback(async () => {
    const res = await fetch("/api/diagnostics/runs");
    if (res.status === 404) {
      setReport(null);
      setError(null);
      return;
    }
    if (!res.ok) {
      setError("Could not load health checks.");
      return;
    }
    const data = await res.json();
    setReport({
      overallScore: data.overallScore ?? 0,
      overallStatus: data.overallStatus ?? "failed",
      results: (data.runs ?? []).map(
        (run: {
          suite: DiagnosticSuite;
          status: TestResult["status"];
          score: number;
          details: Record<string, unknown>;
        }) => ({
          suite: run.suite,
          status: run.status,
          score: run.score,
          details: run.details ?? {},
        })
      ),
      projectId: data.projectId,
    });
    setError(null);
  }, []);

  useEffect(() => {
    loadRuns().finally(() => setLoading(false));
  }, [loadRuns]);

  const runDiagnostic = async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/diagnostics/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: report?.projectId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Health check failed.");
        return;
      }
      setReport({
        overallScore: data.overallScore,
        overallStatus: data.overallStatus,
        results: data.suites ?? data.results ?? [],
        timestamp: data.executedAt,
        projectId: data.projectId,
      });
    } catch {
      setError("Network error while running health checks.");
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6 max-w-5xl">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono mb-1 text-[10px] tracking-widest text-muted-foreground">
            HEALTH
          </p>
          <h1 className="text-[38px] md:text-[48px]">App Health & Audits</h1>
          <p className="text-muted-foreground text-sm mt-1 max-w-[52ch]">
            Checks Google indexing, AI learning, media, and whether ChatGPT and Perplexity mention you.
          </p>
        </div>
        <Button
          className="gap-2 font-mono text-xs tracking-wider"
          disabled={running}
          onClick={runDiagnostic}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${running ? "animate-spin" : ""}`} />
          {running ? "RUNNING..." : "RUN CHECK"}
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-border bg-card px-5 py-4 shadow-sm">
          <p className="font-mono text-[10px] tracking-widest text-muted-foreground mb-1">
            NOTICE
          </p>
          <p className="text-sm text-foreground">{error}</p>
        </div>
      )}

      {!report || report.results.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-6 py-8 shadow-sm">
          <p className="font-mono text-[10px] tracking-widest text-muted-foreground mb-1">
            EMPTY
          </p>
          <h2 className="text-2xl">No health checks yet</h2>
          <p className="text-muted-foreground mt-1 text-sm max-w-[48ch]">
            Onboard a project, then run a check to verify indexing, learning, media, and AI citations.
          </p>
        </div>
      ) : (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <p className="font-mono text-[10px] tracking-widest text-muted-foreground">
                  SYS_HEALTH
                </p>
                <CardTitle className="text-xl">App Health Score</CardTitle>
                <CardDescription>
                  Combined score across indexing, learning, media, and AI search checks
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-4xl tabular-nums">
                  {report.overallScore.toFixed(0)}%
                </span>
                <StatusPill tone={statusTone(report.overallStatus)}>
                  {statusLabel(report.overallStatus)}
                </StatusPill>
              </div>
            </CardHeader>
          </Card>

          <div className="border border-border divide-y divide-border rounded-lg overflow-hidden">
            {report.results.map((test) => (
              <div className="bg-card p-4" key={test.suite}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <StatusPill tone={statusTone(test.status)}>
                      {statusLabel(test.status)}
                    </StatusPill>
                    <h3 className="text-lg truncate">
                      {SUITE_LABELS[test.suite] ?? test.suite.replace(/_/g, " ")}
                    </h3>
                  </div>
                  <span className="font-mono text-sm tabular-nums">{test.score}%</span>
                </div>
                <p className="font-mono text-[11px] text-muted-foreground mt-2">
                  {SUITE_DESCRIPTIONS[test.suite] ?? ""}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {typeof test.details.message === "string"
                    ? test.details.message
                    : typeof test.details.summary === "string"
                      ? test.details.summary
                      : test.status === "passed"
                        ? "All checks passed."
                        : test.status === "warning"
                          ? "Some checks need attention."
                          : "This check did not pass."}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
