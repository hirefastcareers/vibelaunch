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

function PostCard({ post }: { post: QueuePost }) {
  return (
    <div className="border-b border-border bg-card p-4 last:border-b-0">
      <div className="flex gap-4">
        <MediaThumbnail urls={post.mediaUrls} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <StatusPill>{statusTag(post.status)}</StatusPill>
            <span className="font-mono text-[10px] text-muted-foreground">
              {post.projectName}
            </span>
            {post.eri !== null && <EriBadge eri={post.eri} />}
          </div>
          <p className="text-sm font-mono line-clamp-2">{post.content}</p>
          {post.errorMessage ? <PublishError errorMessage={post.errorMessage} /> : null}
          <div className="flex items-center gap-3 mt-2 font-mono text-[10px] text-muted-foreground">
            {post.scheduledAt && <span>{new Date(post.scheduledAt).toLocaleString()}</span>}
            {post.publishedAt && <span>{formatRelativeTime(post.publishedAt)}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function PostList({ posts, emptyMessage }: { posts: QueuePost[]; emptyMessage: string }) {
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
        <PostCard key={post.id} post={post} />
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

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard/queue").then((r) => r.json()),
      fetch("/api/dashboard/stats").then((r) => r.json()),
    ]).then(([queue, stats]) => {
      setData(queue);
      setProjects(stats.projects ?? []);
    }).finally(() => setLoading(false));
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
          <p className="font-mono text-[10px] tracking-widest text-muted-foreground mb-1">
            QUEUE
          </p>
          <h1 className="text-5xl">AI Post Generator & Hooks</h1>
          <p className="mt-1 max-w-[56ch] text-sm text-muted-foreground">
            Draft, schedule, and review every post in one place. The queue should feel like an editorial pipeline, not a dump.
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

      <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="TOTAL" value={queueTotal} className="rounded-none border-0" />
        <StatCard label="PENDING" value={pendingCount} className="rounded-none border-0" />
        <StatCard label="SCHEDULED" value={scheduledCount} className="rounded-none border-0" />
        <StatCard label="PUBLISHED" value={publishedCount} className="rounded-none border-0" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
        <Card>
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
                Hold posts for a better publish window or queue them immediately.
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

        <Card>
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
                  Nothing has been published yet. {hasProjects ? "Generate a post to start the pipeline." : "Onboard a project first, then generate your first post."}
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
          <PostList posts={data?.pending ?? []} emptyMessage="No pending posts. Generate one with AI." />
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
      />
    </div>
  );
}
