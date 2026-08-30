export type DiagnosticSuite =
  | "seo_audit"
  | "feedback_loop"
  | "media_render"
  | "geo_audit";

export type DiagnosticStatus = "passed" | "failed" | "warning";

export interface DiagnosticAssertion {
  name: string;
  passed: boolean;
  severity: "error" | "warning";
  message: string;
  meta?: Record<string, unknown>;
}

export interface SuiteResult {
  suite: DiagnosticSuite;
  status: DiagnosticStatus;
  score: number;
  details: {
    assertions: DiagnosticAssertion[];
    summary: string;
    durationMs: number;
  };
}

export interface DiagnosticRunSummary {
  projectId: string;
  overallScore: number;
  overallStatus: DiagnosticStatus;
  suites: SuiteResult[];
  executedAt: string;
}

export const ALL_SUITES: DiagnosticSuite[] = [
  "seo_audit",
  "feedback_loop",
  "media_render",
  "geo_audit",
];

export const SUITE_LABELS: Record<DiagnosticSuite, string> = {
  seo_audit: "SEO Indexing",
  feedback_loop: "Vector Reinforcement",
  media_render: "Media Integrity",
  geo_audit: "GEO Citations",
};
