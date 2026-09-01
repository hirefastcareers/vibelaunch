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
  seo_audit: "Google Indexing Check",
  feedback_loop: "AI Self-Tuning Check",
  media_render: "Video & Code Card Check",
  geo_audit: "AI Search Citation Check",
};

export const SUITE_DESCRIPTIONS: Record<DiagnosticSuite, string> = {
  seo_audit: "Checks meta tags, schema, and page length",
  feedback_loop: "Verifies the system is learning from viral posts",
  media_render: "Ensures media renders cleanly",
  geo_audit: "Verifies mentions in ChatGPT & Perplexity",
};
