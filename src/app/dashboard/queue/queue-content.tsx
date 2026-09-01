"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { EriBadge } from "@/components/eri-badge";
import { GeneratePostModal } from "@/components/generate-post-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/status-pill";
import { formatRelativeTime } from "@/lib/utils";

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
  };
  return map[status] ?? `[${status.toUpperCase()}]`;
}

function MediaThumbnail({ urls }: { urls: string[] }) {
  if (!urls.length) return null;

  const url = urls[0];
  const isVideo = url.includes("video") || url.includes("placeholder?type=video");
  const isCode = url.includes("code-card");

  return (
    <div className="h-14 w-14 rounded-sm border border-stone-800 bg-muted flex items-center justify-center shrink-0 overflow-hidden font-mono text-[9px] tracking-wider text-muted-foreground">
      {isVideo ? "VID" : isCode ? "CODE" : (
        <img src={url} alt="" className="h-full w-full object-cover" />
      )}
    </div>
  );
}

function PostCard({ post }: { post: QueuePost }) {
  return (
    <div className="border-b border-stone-800 bg-card p-4 last:border-b-0">
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
      <div className="py-8 px-4 font-mono text-[12px] text-muted-foreground border border-stone-800">
        {emptyMessage}
      </div>
    );
  }
  return (
    <div className="border border-stone-800">
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] tracking-widest text-muted-foreground mb-1">
            [QUEUE]
          </p>
          <h1 className="text-4xl">AI Post Generator & Hooks</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Draft, schedule, and publish posts that learn from what already went viral
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="font-mono text-xs tracking-wider">
          GENERATE POST
        </Button>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending" className="font-mono text-[10px] tracking-wider">
            PENDING ({data?.pending.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="font-mono text-[10px] tracking-wider">
            SCHED ({data?.scheduled.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="published" className="font-mono text-[10px] tracking-wider">
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
