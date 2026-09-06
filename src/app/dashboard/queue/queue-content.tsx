"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { EriBadge } from "@/components/eri-badge";
import { GeneratePostModal } from "@/components/generate-post-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/status-pill";
import { formatRelativeTime } from "@/lib/utils";
import { FileText, Video } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface QueuePost {
  id: string;
  content: string;
  status: string;
  mediaUrls: string[];
  scheduledAt: string | null;
  publishedAt: string | null;
  projectName: string;
  eri: number | null;
  xPostUrl: string | null;
  errorMessage?: string | null;
}

interface QueueData {
  pending: QueuePost[];
  scheduled: QueuePost[];
  published: QueuePost[];
}

interface Project {
  id: string;
  name: string;
}

function statusTag(status: string) {
  const map: Record<string, string> = {
    pending: "[PENDING]",
    scheduled: "[SCHED]",
    published: "[LIVE]",
    FAILED: "[FAILED]",
    PUBLISHING: "[PUBLISHING]",
  };
  return map[status] ?? `[${status.toUpperCase()}]`;
}

function stripErrorPrefix(errorMessage: string): string {
  return errorMessage.replace(/^\[(?:AUTH:[^\]]+|API:\d+)\]\s*/, "");
}

function PublishError({ errorMessage }: { errorMessage: string }) {
  if (errorMessage.startsWith("[AUTH:")) {
    return (
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px]">
        <span className="text-muted-foreground">
          Your X connection expired - reconnect to keep publishing
        </span>
        <Link
          href="/auth/signin"
          className="text-primary tracking-wider hover:underline"
        >
          RECONNECT
        </Link>
      </div>
    );
  }

  if (errorMessage.startsWith("[API:429]")) {
    return (
      <p className="mt-2 font-mono text-[10px] text-muted-foreground">
        Rate limited by X - this will retry automatically
      </p>
    );
  }

  return (
    <p className="mt-2 font-mono text-[10px] text-muted-foreground">
      {stripErrorPrefix(errorMessage)}
    </p>
  );
}

function MediaThumbnail({ urls }: { urls: string[] }) {
  const url = urls[0];
  const isVideo = url?.includes("video") || url?.includes("placeholder?type=video");

  return (
    <div className="h-14 w-14 rounded-sm border border-border bg-muted flex items-center justify-center shrink-0 overflow-hidden">
      {!url ? (
        <FileText className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
      ) : isVideo ? (
        <Video className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
      ) : (
        <img src={url} alt="" className="h-full w-full object-cover" />
      )}
    </div>
  );
}

function PostCard({
  post,
  onChanged,
}: {
  post: QueuePost;
  onChanged?: () => void;
}) {
  const [publishing, setPublishing] = useState(false);
  const [actionError, setActionError] = useState("");
  const canPublish = ["DRAFT", "FAILED"].includes(post.status);

  async function handlePublish() {
    setPublishing(true);
    setActionError("");
    try {
      const res = await fetch(`/api/posts/${post.id}/publish`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setActionError(
          typeof data.error === "string" ? data.error : "Publish failed",
        );
        return;
      }
      onChanged?.();
    } catch {
      setActionError("Network error - please try again");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="border-b border-border bg-card p-4 last:border-b-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <MediaThumbnail urls={post.mediaUrls} />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <StatusPill>{statusTag(post.status)}</StatusPill>
            <span className="font-mono text-[10px] text-muted-foreground">
              {post.projectName}
            </span>
            {post.eri !== null && <EriBadge eri={post.eri} />}
          </div>
          <p className="line-clamp-2 font-mono text-sm">{post.content}</p>
          {post.errorMessage ? <PublishError errorMessage={post.errorMessage} /> : null}
          {actionError ? (
            <p className="mt-2 font-mono text-[10px] text-muted-foreground">{actionError}</p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-3 font-mono text-[10px] text-muted-foreground">
            {post.scheduledAt && <span>{new Date(post.scheduledAt).toLocaleString()}</span>}
            {post.publishedAt && <span>{formatRelativeTime(post.publishedAt)}</span>}
            {post.xPostUrl ? (
              <a
                href={post.xPostUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="tracking-wider text-primary hover:underline"
              >
                VIEW ON X
              </a>
            ) : null}
          </div>
        </div>
        {canPublish ? (
          <Button
            type="button"
            onClick={handlePublish}
            disabled={publishing}
            className="shrink-0 font-mono text-xs tracking-wider sm:mt-0"
          >
            {publishing ? "PUBLISHING..." : "PUBLISH TO X"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function PostList({
  posts,
  emptyMessage,
  onChanged,
}: {
  posts: QueuePost[];
  emptyMessage: string;
  onChanged?: () => void;
}) {
  if (!posts.length) {
    return (
      <div className="py-8 px-4 font-mono text-[12px] text-muted-foreground border border-border">
        {emptyMessage}
      </div>
    );
  }
  return (
    <div className="border border-border">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} onChanged={onChanged} />
      ))}
    </div>
  );
}

export default function QueueStudioPage() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<QueueData | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  async function reloadQueue() {
    const [queue, stats] = await Promise.all([
      fetch("/api/dashboard/queue").then((r) => r.json()),
      fetch("/api/dashboard/stats").then((r) => r.json()),
    ]);
    setData(queue);
    setProjects(stats.projects ?? []);
  }

  useEffect(() => {
    reloadQueue().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (searchParams.get("generate") === "true") {
      setModalOpen(true);
    }
  }, [searchParams]);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const pendingCount = data?.pending.length ?? 0;
  const scheduledCount = data?.scheduled.length ?? 0;
  const publishedCount = data?.published.length ?? 0;
  const queueTotal = pendingCount + scheduledCount + publishedCount;
  const latestPublished = data?.published[0];
  const hasProjects = projects.length > 0;

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="font-mono mb-1 text-[10px] tracking-widest text-muted-foreground">
            QUEUE
          </p>
          <h1 className="text-[38px] md:text-[48px]">AI Post Generator & Hooks</h1>
          <p className="mt-1 max-w-[56ch] text-sm text-muted-foreground">
            Generate a draft, then click Publish to X on the pending card. It posts with your connected account.
          </p>
        </div>
        {hasProjects ? (
          <Button onClick={() => setModalOpen(true)} className="font-mono text-xs tracking-wider">
            GENERATE POST
          </Button>
        ) : (
          <Button asChild className="font-mono text-xs tracking-wider">
            <Link href="/onboard">ONBOARD PROJECT</Link>
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="TOTAL" value={queueTotal} />
        <StatCard label="PENDING" value={pendingCount} />
        <StatCard label="SCHEDULED" value={scheduledCount} />
        <StatCard label="PUBLISHED" value={publishedCount} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border pb-4">
            <p className="font-mono text-[10px] tracking-widest text-muted-foreground">
              WORKFLOW
            </p>
            <CardTitle className="mt-1 text-[24px]">How this queue works</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-px p-0 md:grid-cols-3">
            <div className="bg-background px-5 py-5">
              <p className="font-mono text-[10px] tracking-widest text-muted-foreground">01</p>
              <h2 className="mt-2 text-[21px]">Generate</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Start with AI drafts and hooks tailored to your project tone.
              </p>
            </div>
            <div className="bg-card px-5 py-5">
              <p className="font-mono text-[10px] tracking-widest text-muted-foreground">02</p>
              <h2 className="mt-2 text-[21px]">Schedule</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Hold posts for a better publish window, or click Publish to X on a pending draft.
              </p>
            </div>
            <div className="bg-background px-5 py-5">
              <p className="font-mono text-[10px] tracking-widest text-muted-foreground">03</p>
              <h2 className="mt-2 text-[21px]">Learn</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Published posts feed analytics back into the next round of drafts.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border pb-4">
            <p className="font-mono text-[10px] tracking-widest text-muted-foreground">
              LAST OUTPUT
            </p>
            <CardTitle className="mt-1 text-[24px]">Latest published post</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {latestPublished ? (
              <div className="space-y-3">
                <p className="text-sm leading-relaxed">{latestPublished.content}</p>
                <div className="flex flex-wrap gap-2 font-mono text-[10px] text-muted-foreground">
                  <span>{formatRelativeTime(latestPublished.publishedAt)}</span>
                  {latestPublished.eri !== null && <EriBadge eri={latestPublished.eri} />}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Nothing has been published yet. {hasProjects ? "Generate a post, then click Publish to X on the pending draft." : "Onboard a project first, then generate your first post."}
                </p>
                {!hasProjects && (
                  <Link
                    href="/onboard"
                    className="inline-block border-b border-border font-mono text-[11px] tracking-wider text-muted-foreground hover:text-foreground"
                  >
                    GO TO ONBOARDING
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            PENDING ({data?.pending.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="scheduled">
            SCHED ({data?.scheduled.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="published">
            LIVE ({data?.published.length ?? 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <PostList
            posts={data?.pending ?? []}
            emptyMessage="No pending drafts. Generate a post, then Publish to X appears on the card."
            onChanged={reloadQueue}
          />
        </TabsContent>
        <TabsContent value="scheduled">
          <PostList posts={data?.scheduled ?? []} emptyMessage="No scheduled posts." />
        </TabsContent>
        <TabsContent value="published">
          <PostList posts={data?.published ?? []} emptyMessage="No published posts yet." />
        </TabsContent>
      </Tabs>

      <GeneratePostModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        projects={projects}
        onGenerated={() => {
          void reloadQueue();
        }}
        onQueued={() => {
          void reloadQueue();
        }}
      />
    </div>
  );
}
