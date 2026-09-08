"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { LimitHitNotice } from "@/components/limit-hit-notice";

interface GeneratePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: Array<{ id: string; name: string }>;
  onGenerated?: (content: string) => void;
  onQueued?: () => void;
}

export function GeneratePostModal({
  open,
  onOpenChange,
  projects,
  onGenerated,
  onQueued,
}: GeneratePostModalProps) {
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("casual");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [errorCode, setErrorCode] = useState<string | undefined>();
  const [queueing, setQueueing] = useState(false);
  const [queued, setQueued] = useState(false);
  const [queuedPostId, setQueuedPostId] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [publishDone, setPublishDone] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState("");

  useEffect(() => {
    if (!projectId && projects[0]?.id) {
      setProjectId(projects[0].id);
    }
  }, [projectId, projects]);

  async function handleGenerate() {
    if (!projectId || !topic) return;
    setLoading(true);
    setResult("");
    setError("");
    setErrorCode(undefined);
    setQueued(false);
    setQueuedPostId("");
    setPublishDone(false);
    setPublishedUrl("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, topic, tone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorCode(typeof data.code === "string" ? data.code : undefined);
        setError(typeof data.error === "string" ? data.error : "Generation failed");
        return;
      }
      if (data.generated?.content) {
        setResult(data.generated.content);
        onGenerated?.(data.generated.content);
      }
    } catch {
      setError("Network error - please try again");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddToQueue() {
    if (!projectId || !result) return;
    setQueueing(true);
    setError("");
    setErrorCode(undefined);

    try {
      const res = await fetch(`/api/projects/${projectId}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: result }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorCode(typeof data.code === "string" ? data.code : undefined);
        setError(typeof data.error === "string" ? data.error : "Could not add to queue");
        return;
      }
      setQueued(true);
      setQueuedPostId(typeof data.post?.id === "string" ? data.post.id : "");
      onQueued?.();
    } catch {
      setError("Network error - please try again");
    } finally {
      setQueueing(false);
    }
  }

  async function handlePublishToX() {
    if (!queuedPostId) return;
    setPublishing(true);
    setError("");
    setErrorCode(undefined);

    try {
      const res = await fetch(`/api/posts/${queuedPostId}/publish`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Publish failed");
        return;
      }
      const url =
        typeof data.post?.xPostUrl === "string" ? data.post.xPostUrl : "";
      setPublishDone(true);
      setPublishedUrl(url);
      onQueued?.();
    } catch {
      setError("Network error - please try again");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate a post</DialogTitle>
          <DialogDescription>
            Writes a short changelog post: what shipped, then what someone can do now.
            No slogans, hashtags, or emoji piles.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!projects.length && (
            <div className="rounded-lg border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
              No project available yet. Onboard a project before generating posts.
            </div>
          )}

          <div className="space-y-2">
            <Label>Project</Label>
            <Select value={projectId} onValueChange={setProjectId} disabled={!projects.length}>
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Topic</Label>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. X sign-in is live"
            />
          </div>

          <div className="space-y-2">
            <Label>Tone</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="hype">Hype</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="rounded-lg border border-border p-3 text-sm text-muted-foreground">
              <LimitHitNotice code={errorCode} fallback={error} />
            </div>
          )}

          {result && (
            <div className="rounded-lg border border-border bg-muted/50 p-4 text-sm leading-relaxed">
              {result}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button
              onClick={handleGenerate}
              disabled={loading || !topic || !projectId}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate post"
              )}
            </Button>
            {result && (
              <Button
                variant="secondary"
                onClick={handleAddToQueue}
                disabled={queueing || queued}
                className="w-full"
              >
                {queueing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : queued ? (
                  "Added to pending"
                ) : (
                  "Add to queue"
                )}
              </Button>
            )}
            {queued && queuedPostId && !publishDone ? (
              <Button
                onClick={handlePublishToX}
                disabled={publishing}
                className="w-full"
              >
                {publishing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  "Publish to X"
                )}
              </Button>
            ) : null}
            {publishDone && publishedUrl ? (
              <a
                href={publishedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-center text-sm font-medium text-primary hover:underline"
              >
                View on X
              </a>
            ) : null}
            {publishDone && !publishedUrl ? (
              <p className="text-center text-sm text-muted-foreground">
                Queued. It will post with your connected X account.
              </p>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
