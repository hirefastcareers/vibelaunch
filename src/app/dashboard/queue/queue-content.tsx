"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { EriBadge } from "@/components/eri-badge";
import { GeneratePostModal } from "@/components/generate-post-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill, type Tone } from "@/components/status-pill";
import { formatRelativeTime } from "@/lib/utils";
import { FileText, Video } from "lucide-react";
import { DashboardPage, PageHeader } from "@/components/dashboard-page";

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

function postStatusMeta(status: string): { label: string; tone: Tone } {
  switch (status) {
    case "PUBLISHED":
      return { label: "Live", tone: "ok" };
    case "FAILED":
      return { label: "Failed", tone: "fail" };
    case "PUBLISHING":
      return { label: "Publishing", tone: "warn" };
    case "SCHEDULED":
      return { label: "Scheduled", tone: "neutral" };
    case "QUEUED":
      return { label: "Queued", tone: "neutral" };
    default:
      return { label: "Draft", tone: "neutral" };
  }
}

function stripErrorPrefix(errorMessage: string): string {
  return errorMessage.replace(/^\[(?:AUTH:[^\]]+|API:\d+)\]\s*/, "");
}

function PublishError({ errorMessage }: { errorMessage: string }) {
  if (errorMessage.startsWith("[AUTH:")) {
    return (
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span className="text-muted-foreground">
          Your X connection expired. Reconnect to keep publishing.
        </span>
        <Link href="/auth/signin" className="font-medium text-primary hover:underline">
          Reconnect
        </Link>
      </div>
    );
  }

  if (errorMessage.startsWith("[API:429]")) {
    return (
      <p className="mt-2 text-sm text-muted-foreground">
        Rate limited by X. This will retry automatically.
      </p>
    );
  }

  return (
    <p className="mt-2 text-sm text-muted-foreground">{stripErrorPrefix(errorMessage)}</p>
  );
}

function MediaThumbnail({ urls }: { urls: string[] }) {
  const url = urls[0];
  const isVideo = url?.includes("video") || url?.includes("placeholder?type=video");

  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
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
  const meta = postStatusMeta(post.status);

  async function handlePublish() {
    setPublishing(true);
    setActionError("");
    try {
      const res = await fetch(`/api/posts/${post.id}/publish`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setActionError(typeof data.error === "string" ? data.error : "Publish failed");
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
    <div className="border-b border-border bg-background p-4 last:border-b-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <MediaThumbnail urls={post.mediaUrls} />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
            <span className="text-xs text-muted-foreground">{post.projectName}</span>
            {post.eri !== null && <EriBadge eri={post.eri} />}
          </div>
          <p className="line-clamp-2 text-sm leading-relaxed">{post.content}</p>
          {post.errorMessage ? <PublishError errorMessage={post.errorMessage} /> : null}
          {actionError ? <p className="mt-2 text-sm text-destructive">{actionError}</p> : null}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {post.scheduledAt && <span>{new Date(post.scheduledAt).toLocaleString()}</span>}
            {post.publishedAt && <span>{formatRelativeTime(post.publishedAt)}</span>}
            {post.xPostUrl ? (
              <a
                href={post.xPostUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline"
              >
                View on X
              </a>
            ) : null}
          </div>
        </div>
        {canPublish ? (
          <Button
            type="button"
            onClick={handlePublish}
            disabled={publishing}
            className="shrink-0 sm:mt-0"
          >
            {publishing ? "Publishing..." : "Publish to X"}
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
      <div className="rounded-xl border border-border bg-background px-5 py-10 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
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
      <DashboardPage>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-xl" />
      </DashboardPage>
    );
  }

  const hasProjects = projects.length > 0;

  return (
    <DashboardPage>
      <PageHeader
        title="Posts"
        description="Generate a draft, then publish it to X with your connected account."
        actions={
          hasProjects ? (
            <Button onClick={() => setModalOpen(true)}>Generate post</Button>
          ) : (
            <Button asChild>
              <Link href="/onboard">Create project</Link>
            </Button>
          )
        }
      />

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending ({data?.pending.length ?? 0})</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled ({data?.scheduled.length ?? 0})</TabsTrigger>
          <TabsTrigger value="published">Live ({data?.published.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          <PostList
            posts={data?.pending ?? []}
            emptyMessage="No pending drafts. Generate a post, then Publish to X appears on the card."
            onChanged={reloadQueue}
          />
        </TabsContent>
        <TabsContent value="scheduled" className="mt-4">
          <PostList posts={data?.scheduled ?? []} emptyMessage="No scheduled posts." />
        </TabsContent>
        <TabsContent value="published" className="mt-4">
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
    </DashboardPage>
  );
}
