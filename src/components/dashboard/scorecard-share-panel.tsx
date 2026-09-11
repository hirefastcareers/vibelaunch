"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { DataPill } from "@/components/ui/data-pill";
import type { PublicScorecardPayload } from "@/lib/geo/scorecard";

type ScorecardOwnerState = {
  public: boolean;
  slug: string | null;
  publishedAt: string | null;
  publicUrl: string | null;
  brandName: string | null;
  publicScorecardLimit: number;
  preview: PublicScorecardPayload;
};

export function ScorecardSharePanel() {
  const [state, setState] = useState<ScorecardOwnerState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/geo/scorecard", { credentials: "include" });
      const json = (await res.json()) as ScorecardOwnerState & { error?: string };
      if (!res.ok) {
        setError(json.error ?? "Could not load scorecard settings");
        setState(null);
        return;
      }
      setState(json);
    } catch {
      setError("Network error loading scorecard");
      setState(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function patch(body: { public?: boolean; regenerateSlug?: boolean }) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/geo/scorecard", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as ScorecardOwnerState & { error?: string };
      if (!res.ok) {
        setError(json.error ?? "Could not update scorecard");
        return;
      }
      setState(json);
    } catch {
      setError("Network error updating scorecard");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Public scorecard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading scorecard settings…</p>
        </CardContent>
      </Card>
    );
  }

  if (!state) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Public scorecard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error ?? "Unavailable"}</p>
        </CardContent>
      </Card>
    );
  }

  const preview = state.preview;
  const shareHref =
    state.publicUrl != null
      ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          preview.score != null
            ? `Our AI visibility score on Xoopa is ${preview.score}/100.`
            : `Tracking our AI visibility on Xoopa.`
        )}&url=${encodeURIComponent(state.publicUrl)}`
      : null;

  return (
    <Card id="public-scorecard">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="text-base font-medium">Public scorecard</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Opt-in page with aggregate metrics only. Off by default. Available on Free
            (limit {state.publicScorecardLimit}).
          </p>
        </div>
        <DataPill tone={state.public ? "soft" : "outline"}>
          {state.public ? "Public" : "Private"}
        </DataPill>
      </CardHeader>
      <CardContent className="space-y-6">
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard
            label="Preview score"
            value={
              preview.sufficientData && preview.score != null ? preview.score : "—"
            }
            hint={
              preview.sufficientData
                ? "Live calculation from your citation runs"
                : (preview.insufficientReason ?? "Need more successful runs")
            }
          />
          <StatCard
            label="Successful runs"
            value={preview.successfulRuns}
            hint={`${preview.modelsWithData} models with data`}
          />
          <StatCard
            label="Brand"
            value={preview.brandName}
            hint="From your tracked queries"
          />
        </div>

        <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">What stays private</p>
          <p className="mt-1">
            Public pages never include your prompt list, raw model responses, cited URL
            dumps, billing/account details, or competitor brand names. Rank is anonymized
            (e.g. “ranked #2 of 4 tracked brands”).
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {state.public ? (
            <Button
              type="button"
              variant="secondary"
              disabled={saving}
              onClick={() => void patch({ public: false })}
            >
              Unpublish
            </Button>
          ) : (
            <Button
              type="button"
              disabled={saving || state.publicScorecardLimit < 1}
              onClick={() => void patch({ public: true })}
            >
              Publish scorecard
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            disabled={saving}
            onClick={() => void patch({ regenerateSlug: true })}
          >
            Regenerate link
          </Button>
          <Button type="button" variant="secondary" disabled={saving} onClick={() => void load()}>
            Refresh preview
          </Button>
        </div>

        {state.publicUrl ? (
          <div className="space-y-2 text-sm">
            <p className="font-medium text-foreground">Public link</p>
            <p className="break-all font-mono text-xs text-muted-foreground">
              {state.publicUrl}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="secondary" size="sm">
                <Link href={state.publicUrl} target="_blank" rel="noopener noreferrer">
                  Open preview
                </Link>
              </Button>
              {shareHref ? (
                <Button asChild size="sm">
                  <Link href={shareHref} target="_blank" rel="noopener noreferrer">
                    Share on X
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Publish to get a shareable `/score/…` link. Unpublishing 404s the old URL
            immediately.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
