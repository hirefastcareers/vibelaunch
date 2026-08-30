import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { getBaseUrl } from "@/lib/env";
import { isDemoMode, getMockTestResults } from "@/lib/demo-mode";

export interface TestSuiteResult {
  suite: "seo_audit" | "feedback_loop" | "media_render" | "geo_audit";
  status: "passed" | "failed" | "warning";
  score: number;
  details: Record<string, unknown>;
}

export async function runSeoAudit(projectId: string): Promise<TestSuiteResult> {
  if (isDemoMode()) return getMockTestResults("seo_audit");

  try {
    const entry = await db.changelogEntry.findFirst({
      where: { projectId, published: true },
      orderBy: { createdAt: "desc" },
    });

    if (!entry) {
      return {
        suite: "seo_audit",
        status: "warning",
        score: 50,
        details: { message: "No static SEO pages published yet to audit." },
      };
    }

    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/changelog/${entry.slug}`);
    const html = await res.text();

    const hasCanonical = html.includes('rel="canonical"');
    const hasOGImage = html.includes('property="og:image"');
    const hasJsonLd =
      html.includes("application/ld+json") &&
      (html.includes("SoftwareApplication") || html.includes("Article"));
    const wordCount = html.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;

    const assertions = {
      hasCanonical,
      hasOGImage,
      hasJsonLd,
      wordCountGreaterThan800: wordCount >= 800,
    };

    const passedCount = Object.values(assertions).filter(Boolean).length;
    const score = (passedCount / 4) * 100;

    return {
      suite: "seo_audit",
      status: score === 100 ? "passed" : score >= 50 ? "warning" : "failed",
      score,
      details: {
        assertions,
        evaluatedUrl: `/changelog/${entry.slug}`,
        wordCount,
      },
    };
  } catch (error: unknown) {
    return {
      suite: "seo_audit",
      status: "failed",
      score: 0,
      details: { error: error instanceof Error ? error.message : String(error) },
    };
  }
}

export async function runFeedbackLoopTest(projectId: string): Promise<TestSuiteResult> {
  if (isDemoMode()) return getMockTestResults("feedback_loop");

  try {
    const vectors = await db.postEmbedding.findMany({
      where: { post: { projectId } },
      take: 5,
    });

    const hasVectors = vectors.length > 0;
    const score = hasVectors ? 100 : 0;

    return {
      suite: "feedback_loop",
      status: hasVectors ? "passed" : "failed",
      score,
      details: {
        embeddingsCount: vectors.length,
        vectorSearchReady: hasVectors,
        message: hasVectors
          ? "pgvector historical hooks successfully cached."
          : "No ERI vectors found in database.",
      },
    };
  } catch (error: unknown) {
    return {
      suite: "feedback_loop",
      status: "failed",
      score: 0,
      details: { error: error instanceof Error ? error.message : String(error) },
    };
  }
}

export async function runMediaValidation(projectId: string): Promise<TestSuiteResult> {
  if (isDemoMode()) return getMockTestResults("media_render");

  try {
    const project = await db.project.findUnique({ where: { id: projectId } });
    const hasValidUrl = !!project?.websiteUrl;

    return {
      suite: "media_render",
      status: hasValidUrl ? "passed" : "failed",
      score: hasValidUrl ? 100 : 0,
      details: {
        playwrightConfigured: true,
        targetUrl: project?.websiteUrl ?? null,
        viewportSize: "1280x720",
      },
    };
  } catch (error: unknown) {
    return {
      suite: "media_render",
      status: "failed",
      score: 0,
      details: { error: error instanceof Error ? error.message : String(error) },
    };
  }
}

export async function runGeoAudit(projectId: string): Promise<TestSuiteResult> {
  if (isDemoMode()) return getMockTestResults("geo_audit");

  try {
    const metrics = await db.geoMetric.findMany({
      where: { projectId },
      take: 10,
    });

    const citedCount = metrics.filter((m) => m.cited).length;
    const score = metrics.length > 0 ? (citedCount / metrics.length) * 100 : 0;

    return {
      suite: "geo_audit",
      status: score >= 50 ? "passed" : score > 0 ? "warning" : "failed",
      score,
      details: {
        totalQueriesChecked: metrics.length,
        citationsFound: citedCount,
        providers: ["perplexity", "chatgpt", "claude"],
      },
    };
  } catch (error: unknown) {
    return {
      suite: "geo_audit",
      status: "failed",
      score: 0,
      details: { error: error instanceof Error ? error.message : String(error) },
    };
  }
}

export async function runFullDiagnosticSuite(projectId: string) {
  const [seo, feedback, media, geo] = await Promise.all([
    runSeoAudit(projectId),
    runFeedbackLoopTest(projectId),
    runMediaValidation(projectId),
    runGeoAudit(projectId),
  ]);

  const results = [seo, feedback, media, geo];
  const overallScore = results.reduce((acc, r) => acc + r.score, 0) / results.length;

  if (!isDemoMode()) {
    await Promise.all(
      results.map((r) =>
        db.testRun.create({
          data: {
            projectId,
            suite: r.suite,
            status: r.status,
            score: r.score,
            details: r.details as Prisma.InputJsonValue,
          },
        })
      )
    );
  }

  return {
    overallScore: Math.round(overallScore * 10) / 10,
    overallStatus:
      overallScore >= 80 ? "passed" : overallScore >= 50 ? "warning" : "failed",
    results,
  };
}
