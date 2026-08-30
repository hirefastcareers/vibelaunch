"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EriBadge } from "@/components/eri-badge";
import { GeneratePostModal } from "@/components/generate-post-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Clock, CheckCircle, Hourglass, Code, Play } from "lucide-react";
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

function MediaThumbnail({ urls }: { urls: string[] }) {
  if (!urls.length) return null;

  const url = urls[0];
  const isVideo = url.includes("video") || url.includes("placeholder?type=video");
  const isCode = url.includes("code-card");

  return (
    <div className="h-16 w-16 rounded-md border border-border bg-muted flex items-center justify-center shrink-0 overflow-hidden">
      {isVideo ? (
        <Play className="h-6 w-6 text-primary" />
      ) : isCode ? (
        <Code className="h-6 w-6 text-violet-400" />
      ) : (
        <img src={url} alt="" className="h-full w-full object-cover" />
      )}
    </div>
  );
}

function PostCard({ post }: { post: QueuePost }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-4">
          <MediaThumbnail urls={post.mediaUrls} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className="text-[10px]">{post.projectName}</Badge>
              {post.eri !== null && <EriBadge eri={post.eri} />}
            </div>
            <p className="text-sm line-clamp-2">{post.content}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              {post.scheduledAt && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(post.scheduledAt).toLocaleString()}
                </span>
              )}
              {post.publishedAt && (
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  {formatRelativeTime(post.publishedAt)}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PostList({ posts, emptyMessage }: { posts: QueuePost[]; emptyMessage: string }) {
  if (!posts.length) {
    return (
      <div className="py-12 text-center text-muted-foreground text-sm">{emptyMessage}</div>
    );
  }
  return (
    <div className="space-y-3">
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
      <div className="p-8 space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Queue & Content Studio</h1>
          <p className="text-muted-foreground mt-1">
            Manage pending, scheduled, and published posts
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Sparkles className="h-4 w-4" />
          Generate New Post with AI
        </Button>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending" className="gap-1.5">
            <Hourglass className="h-3.5 w-3.5" />
            Pending ({data?.pending.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Scheduled ({data?.scheduled.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="published" className="gap-1.5">
            <CheckCircle className="h-3.5 w-3.5" />
            Published ({data?.published.length ?? 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <PostList posts={data?.pending ?? []} emptyMessage="No pending posts. Generate one with AI!" />
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
