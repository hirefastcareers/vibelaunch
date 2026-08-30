import sharp from "sharp";
import { validateMediaUrls, processImage, getMediaMetadata } from "@/lib/media/engine";
import { renderCodeCard } from "@/lib/media/code-card";
import type { DiagnosticAssertion, SuiteResult } from "../types";
import { computeSuiteScore, deriveSuiteStatus } from "../scoring";

/** Minimal valid 2×2 PNG for integrity checks */
async function samplePngBuffer(): Promise<Buffer> {
  return sharp({
    create: {
      width: 2,
      height: 2,
      channels: 3,
      background: { r: 99, g: 102, b: 241 },
    },
  })
    .png()
    .toBuffer();
}

export async function runMediaRenderAudit(_projectId: string): Promise<SuiteResult> {
  const start = Date.now();
  const assertions: DiagnosticAssertion[] = [];

  const validUrls = validateMediaUrls([
    "https://example.com/image.png",
    "https://cdn.example.com/photo.jpg",
  ]);
  assertions.push({
    name: "media_url_validation",
    passed: validUrls.valid,
    severity: "error",
    message: validUrls.valid
      ? "Media URL validator accepts standard image formats"
      : `Media URL validation failed: ${validUrls.errors.join(", ")}`,
  });

  const invalidUrls = validateMediaUrls([
    "https://example.com/doc.pdf",
    "https://example.com/a.png",
    "https://example.com/b.png",
    "https://example.com/c.png",
    "https://example.com/d.png",
    "https://example.com/e.png",
  ]);
  assertions.push({
    name: "media_count_limit",
    passed: !invalidUrls.valid && invalidUrls.errors.some((e) => e.includes("Maximum 4")),
    severity: "error",
    message: invalidUrls.errors.some((e) => e.includes("Maximum 4"))
      ? "Media count limit (4) enforced correctly"
      : "Media count limit check did not trigger as expected",
  });

  try {
    const input = await samplePngBuffer();
    const processed = await processImage(input);
    const meta = await getMediaMetadata(processed);

    assertions.push({
      name: "image_processing",
      passed: processed.length > 0 && meta.width > 0 && meta.height > 0,
      severity: "error",
      message: `Image pipeline processed ${meta.width}×${meta.height} ${meta.format} (${meta.sizeBytes} bytes)`,
      meta: meta,
    });

    assertions.push({
      name: "x_size_constraints",
      passed: meta.sizeBytes <= 5 * 1024 * 1024 && meta.width <= 4096 && meta.height <= 4096,
      severity: "error",
      message:
        meta.sizeBytes <= 5 * 1024 * 1024
          ? "Output within X posting size limits (≤5MB, ≤4096px)"
          : "Processed image exceeds X size constraints",
    });
  } catch (err) {
    assertions.push({
      name: "image_processing",
      passed: false,
      severity: "error",
      message: err instanceof Error ? err.message : "Image processing failed",
    });
  }

  try {
    const card = await renderCodeCard({
      code: 'const launch = () => "VibeLaunch";',
      language: "typescript",
      title: "Diagnostic Check",
    });
    assertions.push({
      name: "code_card_render",
      passed: card.width === 1200 && card.height === 630 && card.imageUrl.length > 0,
      severity: "warning",
      message: `Code card renderer returned ${card.width}×${card.height} asset`,
      meta: { imageUrl: card.imageUrl },
    });
  } catch (err) {
    assertions.push({
      name: "code_card_render",
      passed: false,
      severity: "warning",
      message: err instanceof Error ? err.message : "Code card render failed",
    });
  }

  const score = computeSuiteScore(assertions);
  const status = deriveSuiteStatus(score, assertions);
  const passed = assertions.filter((a) => a.passed).length;

  return {
    suite: "media_render",
    status,
    score,
    details: {
      assertions,
      summary: `${passed}/${assertions.length} checks passed — media integrity ${status}`,
      durationMs: Date.now() - start,
    },
  };
}
