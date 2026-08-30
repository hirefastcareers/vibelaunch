import type { TestSuiteResult } from "./runner";

export type DiagnosticSuite = TestSuiteResult["suite"];
export type DiagnosticStatus = TestSuiteResult["status"];

export type SuiteResult = TestSuiteResult;

export interface DiagnosticRunSummary {
  projectId: string;
  overallScore: number;
  overallStatus: DiagnosticStatus;
  suites: TestSuiteResult[];
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
