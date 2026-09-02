"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { SUITE_LABELS, SUITE_DESCRIPTIONS, type DiagnosticSuite } from "@/lib/diagnostics/types";
import { getMockTestResults } from "@/lib/demo-mode";
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
}

const INITIAL_REPORT: DiagnosticReport = {
  overallScore: 92.5,
  overallStatus: "passed",
  results: [
    getMockTestResults("seo_audit") as TestResult,
    getMockTestResults("feedback_loop") as TestResult,
    getMockTestResults("media_render") as TestResult,
    getMockTestResults("geo_audit") as TestResult,
  ],
};

export default function DiagnosticsPage() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<DiagnosticReport>(INITIAL_REPORT);

  const runDiagnostic = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/agent/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: "demo-project" }),
      });
      const data = await res.json();
      if (data.success) {
        setReport({
          overallScore: data.overallScore,
          overallStatus: data.overallStatus,
          results: data.results,
          timestamp: data.timestamp,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] tracking-widest text-muted-foreground mb-1">
            HEALTH
          </p>
          <h1 className="text-4xl">App Health & Audits</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Checks Google indexing, AI learning, media, and whether ChatGPT and Perplexity mention you.
          </p>
        </div>
        <Button className="gap-2 font-mono text-xs tracking-wider" disabled={loading} onClick={runDiagnostic}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          RUN CHECK
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="space-y-1">
            <p className="font-mono text-[10px] tracking-widest text-muted-foreground">SYS_HEALTH</p>
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

      <div className="border border-border divide-y divide-border">
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
    </div>
  );
}
