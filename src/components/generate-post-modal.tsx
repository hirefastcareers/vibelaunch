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
}

export function GeneratePostModal({
  open,
  onOpenChange,
  projects,
  onGenerated,
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
    } catch {
      setError("Network error - please try again");
    } finally {
      setQueueing(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate New Post</DialogTitle>
          <DialogDescription>
            Uses your viral posts to write stronger hooks and copy.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!projects.length && (
            <div className="rounded-sm border border-border bg-muted p-3 font-mono text-[12px] text-muted-foreground">
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
              placeholder="e.g. shipped dark mode, hit 100 users"
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
            <div className="rounded-sm border border-border p-3 font-mono text-[12px] text-muted-foreground">
              <LimitHitNotice code={errorCode} fallback={error} />
            </div>
          )}

          {result && (
            <div className="rounded-sm border border-border bg-muted p-4 font-mono text-sm">
              {result}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button
              onClick={handleGenerate}
              disabled={loading || !topic || !projectId}
              className="w-full font-mono text-xs tracking-wider"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Post"
              )}
            </Button>
            {result && (
              <Button
                variant="secondary"
                onClick={handleAddToQueue}
                disabled={queueing || queued}
                className="w-full font-mono text-xs tracking-wider"
              >
                {queueing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : queued ? (
                  "Added to queue"
                ) : (
                  "Add to queue"
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
