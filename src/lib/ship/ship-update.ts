import { prisma } from "@/lib/prisma";
import { generateAdaptiveContent } from "@/lib/generator/adaptive";
import { expandForSeo } from "@/lib/seo/expander";
import { requestGoogleIndexing } from "@/lib/seo/google-indexing";
import { captureSiteScreenshot } from "@/lib/media/site-capture";
import { validateMediaUrls } from "@/lib/media/engine";
import { assertCanCreatePost, UsageLimitError } from "@/lib/billing/limits";
import { getBaseUrl } from "@/lib/env";
import { dispatchPostPublish } from "@/lib/queue/dispatch-post";
import { deriveShipTitle, type ShipUpdateInput } from "./schema";

export type ShipStepStatus = "ok" | "skipped" | "failed";

export type ShipStepResult = {
  status: ShipStepStatus;
  error?: string;
};

export type ShipUpdateResult = {
  projectId: string;
  projectName: string;
  update: string;
  steps: {
    generate: ShipStepResult & { content?: string; inspiredBy?: string[] };
    article: ShipStepResult & {
      url?: string;
      slug?: string;
      indexing?: { success: boolean; error?: string };
    };
    media: ShipStepResult & { url?: string };
    post: ShipStepResult & {
      id?: string;
      content?: string;
      mediaUrls?: string[];
      xPostUrl?: string | null;
    };
    geo: ShipStepResult & {
      citationScore?: number;
      checkedAt?: string;
    };
  };
};

/**
 * One founder update → X draft (+ optional publish), changelog article,
 * screenshot attach. Legacy project GEO check retired (Phase 2 citation tracking). Partial success is intentional:
 * later steps still run when earlier non-critical ones fail (e.g. media).
 */
export async function shipUpdate(
  userId: string,
  input: ShipUpdateInput
): Promise<ShipUpdateResult> {
  const project = await prisma.project.findFirst({
    where: { id: input.projectId, userId },
  });
  if (!project) {
    throw new ShipError("Project not found", 404);
  }

  try {
    await assertCanCreatePost(userId);
  } catch (err) {
    if (err instanceof UsageLimitError) {
      throw new ShipError(err.message, 403, err.code);
    }
    throw err;
  }

  const result: ShipUpdateResult = {
    projectId: project.id,
    projectName: project.name,
    update: input.update.trim(),
    steps: {
      generate: { status: "failed" },
      article: { status: "failed" },
      media: { status: "skipped" },
      post: { status: "failed" },
      geo: { status: "failed" },
    },
  };

  // 1. Draft X post
  let postContent = "";
  let inspiredBy: string[] = [];
  try {
    const generated = await generateAdaptiveContent(
      project.id,
      input.update.trim(),
      input.tone ?? "casual"
    );
    postContent = generated.content.slice(0, 280);
    inspiredBy = generated.inspiredBy;
    result.steps.generate = {
      status: "ok",
      content: postContent,
      inspiredBy,
    };
  } catch (error) {
    result.steps.generate = {
      status: "failed",
      error: error instanceof Error ? error.message : "Generation failed",
    };
    // Without a draft we still try article + geo; post step stays failed.
  }

  // 2. Changelog article
  const title = deriveShipTitle(input.update);
  try {
    const expanded = await expandForSeo(
      title,
      input.update.trim(),
      project.name,
      project.keywords
    );
    const existingSlug = await prisma.changelogEntry.findUnique({
      where: { slug: expanded.slug },
    });
    const slug = existingSlug
      ? `${expanded.slug}-${Date.now()}`
      : expanded.slug;

    const entry = await prisma.changelogEntry.create({
      data: {
        projectId: project.id,
        slug,
        title,
        summary: input.update.trim().slice(0, 500),
        body: expanded.body,
        seoTitle: expanded.seoTitle,
        seoDesc: expanded.seoDesc,
        keywords: expanded.keywords,
        published: true,
        publishedAt: new Date(),
      },
    });

    const changelogUrl = `${getBaseUrl()}/changelog/${entry.slug}`;
    const indexing = await requestGoogleIndexing(changelogUrl);
    if (indexing.success) {
      await prisma.changelogEntry.update({
        where: { id: entry.id },
        data: { indexedAt: new Date() },
      });
    }

    result.steps.article = {
      status: "ok",
      url: changelogUrl,
      slug: entry.slug,
      indexing,
    };
  } catch (error) {
    result.steps.article = {
      status: "failed",
      error: error instanceof Error ? error.message : "Article publish failed",
    };
  }

  // 3. Screenshot capture (best-effort)
  let mediaUrls: string[] = [];
  if (!project.websiteUrl) {
    result.steps.media = {
      status: "skipped",
      error: "Project has no website URL to capture",
    };
  } else {
    try {
      const { blobUrl, capturedAt } = await captureSiteScreenshot(
        project.websiteUrl
      );
      await prisma.project.update({
        where: { id: project.id },
        data: { lastCaptureUrl: blobUrl, lastCapturedAt: capturedAt },
      });
      const validation = validateMediaUrls([blobUrl]);
      if (validation.valid) {
        mediaUrls = [blobUrl];
        result.steps.media = { status: "ok", url: blobUrl };
      } else {
        result.steps.media = {
          status: "failed",
          error: validation.errors.join("; ") || "Captured media rejected",
          url: blobUrl,
        };
      }
    } catch (error) {
      result.steps.media = {
        status: "failed",
        error: error instanceof Error ? error.message : "Screenshot capture failed",
      };
    }
  }

  // 4. Create draft post (with media when available)
  if (postContent) {
    try {
      const post = await prisma.post.create({
        data: {
          projectId: project.id,
          content: postContent,
          mediaUrls,
          status: "DRAFT",
        },
      });

      if (input.publishToX) {
        try {
          const published = await dispatchPostPublish({
            postId: post.id,
            projectId: project.id,
            userId,
            content: post.content,
            mediaUrls: post.mediaUrls,
            scheduledAt: null,
          });
          const fresh = await prisma.post.findUnique({
            where: { id: post.id },
            select: {
              id: true,
              content: true,
              mediaUrls: true,
              xPostUrl: true,
              status: true,
            },
          });
          result.steps.post = {
            status: "ok",
            id: fresh?.id ?? post.id,
            content: fresh?.content ?? post.content,
            mediaUrls: fresh?.mediaUrls ?? post.mediaUrls,
            xPostUrl: fresh?.xPostUrl ?? null,
            error:
              published.mode === "queued"
                ? "Post queued for X"
                : undefined,
          };
        } catch (error) {
          result.steps.post = {
            status: "ok",
            id: post.id,
            content: post.content,
            mediaUrls: post.mediaUrls,
            xPostUrl: null,
            error:
              error instanceof Error
                ? `Draft saved, but publish to X failed: ${error.message}`
                : "Draft saved, but publish to X failed",
          };
        }
      } else {
        result.steps.post = {
          status: "ok",
          id: post.id,
          content: post.content,
          mediaUrls: post.mediaUrls,
          xPostUrl: null,
        };
      }
    } catch (error) {
      result.steps.post = {
        status: "failed",
        error: error instanceof Error ? error.message : "Could not create post",
      };
    }
  } else {
    result.steps.post = {
      status: "failed",
      error: "Skipped because post generation failed",
    };
  }

  // 5. Legacy project GEO check retired — citation tracking is Phase 2 TrackedQuery sweeps.
  result.steps.geo = {
    status: "skipped",
    error:
      "Legacy GeoMetric check removed. Use dashboard citation tracking (CitationRun / tracked queries).",
  }

  return result;
}

export class ShipError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = "ShipError";
  }
}
