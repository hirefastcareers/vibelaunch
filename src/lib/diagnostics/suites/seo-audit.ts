import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/env";
import { buildGeoJsonLd } from "@/lib/geo/llm-schema";
import type { DiagnosticAssertion, SuiteResult } from "../types";
import { computeSuiteScore, deriveSuiteStatus } from "../scoring";

export async function runSeoAudit(projectId: string): Promise<SuiteResult> {
  const start = Date.now();
  const assertions: DiagnosticAssertion[] = [];

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      changelog: { where: { published: true } },
    },
  });

  if (!project) {
    assertions.push({
      name: "project_exists",
      passed: false,
      severity: "error",
      message: "Project not found",
    });
    const score = 0;
    return buildResult(assertions, score, start);
  }

  const published = project.changelog;
  assertions.push({
    name: "published_changelogs",
    passed: published.length > 0,
    severity: "error",
    message:
      published.length > 0
        ? `${published.length} published changelog(s) found`
        : "No published changelog pages — SEO indexing cannot begin",
    meta: { count: published.length },
  });

  const missingSeo = published.filter((e) => !e.seoTitle || !e.seoDesc);
  assertions.push({
    name: "seo_metadata_complete",
    passed: missingSeo.length === 0,
    severity: "error",
    message:
      missingSeo.length === 0
        ? "All changelogs have seoTitle and seoDesc"
        : `${missingSeo.length} changelog(s) missing SEO metadata`,
    meta: { missing: missingSeo.map((e) => e.slug) },
  });

  const missingKeywords = published.filter((e) => e.keywords.length === 0);
  assertions.push({
    name: "changelog_keywords",
    passed: missingKeywords.length === 0,
    severity: "warning",
    message:
      missingKeywords.length === 0
        ? "All changelogs have target keywords"
        : `${missingKeywords.length} changelog(s) missing keywords`,
  });

  const notIndexed = published.filter((e) => !e.indexedAt);
  const googleConfigured =
    !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    !!process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  assertions.push({
    name: "google_indexing_submitted",
    passed: notIndexed.length === 0 || !googleConfigured,
    severity: googleConfigured ? "warning" : "warning",
    message: googleConfigured
      ? notIndexed.length === 0
        ? "All changelogs submitted to Google Indexing API"
        : `${notIndexed.length} changelog(s) not yet indexed`
      : "Google Indexing API not configured — skipping index check",
    meta: { notIndexed: notIndexed.length, googleConfigured },
  });

  const baseUrl = getBaseUrl();
  const sample = published[0];
  if (sample) {
    const jsonLd = buildGeoJsonLd({
      projectName: project.name,
      projectUrl: project.websiteUrl ?? `${baseUrl}/changelog/${sample.slug}`,
      description: project.description ?? sample.summary,
      tagline: project.tagline,
      keywords: project.keywords,
      changelogTitle: sample.title,
      changelogSummary: sample.summary,
      changelogUrl: `${baseUrl}/changelog/${sample.slug}`,
    });
    const graph = jsonLd["@graph"] as Array<{ "@type": string }>;
    const hasSoftware = graph.some((n) => n["@type"] === "SoftwareApplication");
    const hasFaq = graph.some((n) => n["@type"] === "FAQPage");

    assertions.push({
      name: "json_ld_schema",
      passed: hasSoftware && hasFaq,
      severity: "error",
      message:
        hasSoftware && hasFaq
          ? "Changelog JSON-LD includes SoftwareApplication and FAQPage"
          : "Missing required JSON-LD schema types for LLM indexing",
      meta: { hasSoftware, hasFaq },
    });
  } else {
    assertions.push({
      name: "json_ld_schema",
      passed: false,
      severity: "warning",
      message: "No published changelog to validate JSON-LD schema",
    });
  }

  const score = computeSuiteScore(assertions);
  return buildResult(assertions, score, start);
}

function buildResult(
  assertions: DiagnosticAssertion[],
  score: number,
  start: number
): SuiteResult {
  const status = deriveSuiteStatus(score, assertions);
  const passed = assertions.filter((a) => a.passed).length;
  return {
    suite: "seo_audit",
    status,
    score,
    details: {
      assertions,
      summary: `${passed}/${assertions.length} checks passed — SEO indexing readiness ${status}`,
      durationMs: Date.now() - start,
    },
  };
}
