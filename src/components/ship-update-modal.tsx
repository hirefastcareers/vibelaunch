"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, Loader2, X } from "lucide-react";
import Link from "next/link";
import { LimitHitNotice } from "@/components/limit-hit-notice";

interface ShipUpdateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: Array<{ id: string; name: string }>;
  onShipped?: () => void;
}

type StepKey = "generate" | "article" | "media" | "post" | "geo";

type ShipResponse = {
  projectName?: string;
  steps?: Record<
    StepKey,
    {
      status: "ok" | "skipped" | "failed";
      error?: string;
      content?: string;
      url?: string;
      id?: string;
      mediaUrls?: string[];
      xPostUrl?: string | null;
      citationScore?: number;
      inspiredBy?: string[];
    }
  >;
  error?: string;
  code?: string;
};

const STEP_LABELS: Record<StepKey, string> = {
  generate: "Draft X post",
  article: "Changelog article",
  media: "Screenshot",
  post: "Queue draft",
  geo: "AI citation check",
};

export function ShipUpdateModal({
  open,
  onOpenChange,
  projects,
  onShipped,
}: ShipUpdateModalProps) {
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [update, setUpdate] = useState("");
  const [publishToX, setPublishToX] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorCode, setErrorCode] = useState<string | undefined>();
  const [result, setResult] = useState<ShipResponse | null>(null);

  useEffect(() => {
    if (!projectId && projects[0]?.id) setProjectId(projects[0].id);
  }, [projectId, projects]);

  async function handleShip() {
    if (!projectId || !update.trim()) return;
    setLoading(true);
    setError("");
    setErrorCode(undefined);
    setResult(null);

    try {
      const res = await fetch("/api/ship", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          update: update.trim(),
          tone: "casual",
          publishToX,
        }),
      });
      const data = (await res.json()) as ShipResponse;
      if (!res.ok && !data.steps) {
        setErrorCode(typeof data.code === "string" ? data.code : undefined);
        setError(
          typeof data.error === "string" ? data.error : "Ship update failed"
        );
        return;
      }
      setResult(data);
      onShipped?.();
    } catch {
      setError("Network error - please try again");
    } finally {
      setLoading(false);
    }
  }

  function resetAndClose(next: boolean) {
    if (!next) {
      setUpdate("");
      setResult(null);
      setError("");
      setErrorCode(undefined);
      setPublishToX(false);
    }
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ship an update</DialogTitle>
          <DialogDescription>
            One short note becomes an X draft, a public changelog article, a
            screenshot, and an AI citation check.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!projects.length && (
            <div className="rounded-lg border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
              Onboard a project before shipping an update.
            </div>
          )}

          <div className="space-y-2">
            <Label>Project</Label>
            <Select
              value={projectId}
              onValueChange={setProjectId}
              disabled={!projects.length || loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>What did you ship?</Label>
            <Textarea
              value={update}
              onChange={(e) => setUpdate(e.target.value)}
              placeholder="e.g. X sign-in is live. Founders can connect and publish in one click."
              rows={4}
              maxLength={500}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              {update.trim().length}/500
            </p>
          </div>

          <label className="flex cursor-pointer items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={publishToX}
              onChange={(e) => setPublishToX(e.target.checked)}
              disabled={loading}
            />
            <span>
              <span className="font-medium text-foreground">Also publish to X</span>
              <span className="mt-0.5 block text-muted-foreground">
                Otherwise the draft stays in Posts for review.
              </span>
            </span>
          </label>

          {error && (
            <div className="rounded-lg border border-border p-3 text-sm text-muted-foreground">
              <LimitHitNotice code={errorCode} fallback={error} />
            </div>
          )}

          {result?.steps && (
            <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
              <p className="text-xs font-medium text-muted-foreground">Results</p>
              {(Object.keys(STEP_LABELS) as StepKey[]).map((key) => {
                const step = result.steps?.[key];
                if (!step) return null;
                return (
                  <div key={key} className="flex items-start gap-3 text-sm">
                    <StepIcon status={step.status} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">
                        {STEP_LABELS[key]}
                      </p>
                      {key === "generate" && step.content && (
                        <p className="mt-1 text-muted-foreground">{step.content}</p>
                      )}
                      {key === "generate" &&
                        step.inspiredBy &&
                        step.inspiredBy.length > 0 && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Used your top posts for tone
                          </p>
                        )}
                      {key === "article" && step.url && (
                        <a
                          href={step.url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-block font-medium text-primary hover:underline"
                        >
                          View article
                        </a>
                      )}
                      {key === "media" && step.url && step.status === "ok" && (
                        // Captured PNG preview from Vercel Blob
                        <img
                          src={step.url}
                          alt="Captured screenshot"
                          className="mt-2 max-h-28 rounded-lg border border-border"
                        />
                      )}
                      {key === "post" && step.id && (
                        <Link
                          href="/dashboard/queue"
                          className="mt-1 inline-block font-medium text-primary hover:underline"
                        >
                          Open in Posts
                        </Link>
                      )}
                      {key === "post" && step.xPostUrl && (
                        <a
                          href={step.xPostUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 ml-3 inline-block font-medium text-primary hover:underline"
                        >
                          View on X
                        </a>
                      )}
                      {key === "geo" &&
                        typeof step.citationScore === "number" && (
                          <p className="mt-1 text-muted-foreground">
                            Citation score {step.citationScore}%
                          </p>
                        )}
                      {step.error && (
                        <p className="mt-1 text-muted-foreground">{step.error}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <Button
            onClick={() => void handleShip()}
            disabled={loading || !projectId || !update.trim()}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Shipping update...
              </>
            ) : result ? (
              "Ship another update"
            ) : (
              "Ship update"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StepIcon({ status }: { status: "ok" | "skipped" | "failed" }) {
  if (status === "ok") {
    return (
      <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Check className="h-3 w-3" />
      </span>
    );
  }
  if (status === "skipped") {
    return (
      <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">
        –
      </span>
    );
  }
  return (
    <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-muted text-muted-foreground">
      <X className="h-3 w-3" />
    </span>
  );
}
