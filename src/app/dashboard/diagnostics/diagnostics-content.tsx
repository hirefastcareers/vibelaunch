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
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { SUITE_LABELS, SUITE_DESCRIPTIONS, type DiagnosticSuite } from "@/lib/diagnostics/types";
import { getMockTestResults } from "@/lib/demo-mode";

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

function statusIcon(status: string) {
  switch (status) {
    case "passed":
      return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
    case "warning":
      return <AlertTriangle className="h-5 w-5 text-amber-500" />;
    default:
      return <XCircle className="h-5 w-5 text-rose-500" />;
  }
}

function statusBadgeVariant(
  status: string
): "viral" | "baseline" | "low" | "default" {
  switch (status) {
    case "passed":
      return "viral";
    case "warning":
      return "baseline";
    case "failed":
      return "low";
    default:
      return "default";
  }
}

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
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">App Health & Audits</h1>
          <p className="text-muted-foreground">
            Checks Google indexing, AI learning, media, and whether ChatGPT and Perplexity mention you.
          </p>
        </div>
        <Button className="gap-2" disabled={loading} onClick={runDiagnostic}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Run Instant Diagnostic
        </Button>
      </div>

      <Card className="border-border/40 bg-card/60 backdrop-blur">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="space-y-1">
            <CardTitle className="text-xl flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary" />
              App Health Score
            </CardTitle>
            <CardDescription>
              Combined score across indexing, learning, media, and AI search checks
            </CardDescription>
          </div>
          <div className="text-right">
            <span className="text-4xl font-extrabold">
              {report.overallScore.toFixed(0)}%
            </span>
            <Badge
              className="ml-3 uppercase"
              variant={statusBadgeVariant(report.overallStatus)}
            >
              {report.overallStatus}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {report.results.map((test) => (
          <Card className="border-border/40" key={test.suite}>
            <CardHeader className="pb-2">
              <div className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  {statusIcon(test.status)}
                  {SUITE_LABELS[test.suite] ?? test.suite.replace(/_/g, " ")}
                </CardTitle>
                <span className="font-semibold text-sm">{test.score}%</span>
              </div>
              <CardDescription className="pt-2">
                {SUITE_DESCRIPTIONS[test.suite] ?? ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
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
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
