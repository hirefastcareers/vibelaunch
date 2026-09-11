"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatCard } from "@/components/dashboard/stat-card";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { DataPill } from "@/components/ui/data-pill";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import { formatFirstResultsMessage } from "@/lib/geo/next-citation-sweep";

type DashboardRow = {
  model: string;
  label: string;
  mentionRate: number;
  mentioned: number;
  total: number;
  recentCitedUrls: string[];
};

type TrackedQueryRow = {
  id: string;
  brandName: string;
  promptText: string;
  active: boolean;
};

type SentimentCounts = {
  positive: number;
  neutral: number;
  negative: number;
  unclassified: number;
};

type DashboardPayload = {
  demo: boolean;
  brandName: string | null;
  trackedQueries: TrackedQueryRow[];
  rows: DashboardRow[];
  trend: Array<{
    date: string;
    openai: number;
    anthropic: number;
    gemini: number;
    perplexity: number;
    grok: number;
  }>;
  mentionTrend: Array<{ date: string; mentionRate: number }>;
  recentUrls: string[];
  sentiment?: SentimentCounts;
  sentimentByModel?: Array<{
    model: string;
    label: string;
    counts: SentimentCounts;
  }>;
  note: string;
};

type UsageInfo = {
  planTier: string;
  trackedQueryCount: number;
  trackedQueryLimit: number;
};

type CompetitorRow = {
  id: string;
  brandName: string;
  createdAt: string;
};

type CompetitorUsage = {
  planTier: string;
  competitorCount: number;
  competitorLimit: number;
};

type ShareRow = {
  key: string;
  label: string;
  isYou: boolean;
  mentionRate: number;
  mentioned: number;
  total: number;
};

type ComparisonPayload = {
  yourBrand: string | null;
  competitors: CompetitorRow[];
  overall: ShareRow[];
  byModel: Array<{ model: string; label: string; brands: ShareRow[] }>;
  trend: Array<Record<string, string | number>>;
  sentimentByBrand?: Array<{
    key: string;
    label: string;
    isYou: boolean;
    counts: SentimentCounts;
  }>;
  runsAnalyzed: number;
  runsSkipped: number;
  note: string;
};

type CitationGapRow = {
  trackedQueryId: string;
  brandName: string;
  promptText: string;
  model: string;
  modelLabel: string;
  runsConsidered: number;
  mentioned: number;
  mentionRate: number;
  latestMissed: boolean;
  latestRunAt: string;
  reason: "latest_miss" | "low_rate" | "both";
};

type ContentSuggestionRow = {
  id: string;
  trackedQueryId: string;
  model: string;
  suggestionText: string;
  status: "NEW" | "DISMISSED" | "ACTIONED";
  regenerationCount: number;
  createdAt: string;
  brandName: string;
  promptText: string;
  publishedUrl: string | null;
  publishedAt: string | null;
  outcomes: Array<{
    id: string;
    matchType: "EXACT" | "DOMAIN";
    model: string;
    matchedAt: string;
    citationRunId: string;
  }>;
  runsAfterPublish: number;
  outcomeStatus:
    | "needs_url"
    | "awaiting"
    | "cited_exact"
    | "cited_domain_only"
    | "not_yet_cited";
  awaitingRunThreshold: number;
};

type OutcomeSummary = {
  publishedWithUrl: number;
  observedEnoughRuns: number;
  earnedExactCitation: number;
  earnedDomainOnly: number;
  showAggregate: boolean;
};

const FIX_MODEL_LABELS: Record<string, string> = {
  openai: "ChatGPT",
  anthropic: "Claude",
  gemini: "Gemini",
  perplexity: "Perplexity",
  grok: "Grok",
};

function formatOutcomeWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

type DomainTallyRow = {
  domain: string;
  count: number;
  models: string[];
  sampleUrls: string[];
};

type GapAnalysisState = {
  loadingPreview?: boolean;
  loadingGenerate?: boolean;
  previewDomains?: DomainTallyRow[];
  missedRunCount?: number;
  analysisText?: string | null;
  fetchNotes?: Array<{ url: string; status: string; detail?: string }>;
  cached?: boolean;
  error?: string | null;
};

type ViewMode =
  | "share"
  | "trend"
  | "urls"
  | "prompts"
  | "competitors"
  | "compare"
  | "fixes";


function SentimentSplit({
  counts,
  emptyLabel = "No classified mentions yet",
}: {
  counts?: SentimentCounts | null;
  emptyLabel?: string;
}) {
  if (!counts) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }
  const total =
    counts.positive + counts.neutral + counts.negative + counts.unclassified;
  if (total === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      <DataPill tone="soft">Positive {counts.positive}</DataPill>
      <DataPill tone="outline">Neutral {counts.neutral}</DataPill>
      <DataPill tone="outline">Negative {counts.negative}</DataPill>
      {counts.unclassified > 0 ? (
        <DataPill tone="outline">Unclassified {counts.unclassified}</DataPill>
      ) : null}
    </div>
  );
}


function formatLimitError(json: {
  error?: string;
  code?: string;
  upgradePath?: string;
}): string {
  const base = json.error ?? "Request failed";
  if (
    json.code === "TRACKED_QUERY_LIMIT" ||
    json.code === "COMPETITOR_LIMIT" ||
    json.code === "SUGGESTION_LIMIT"
  ) {
    return `${base} Open Billing to upgrade.`;
  }
  return base;
}

export function CitationTrackingCard({
  demoMode,
  defaultBrand = "",
}: {
  demoMode: boolean;
  defaultBrand?: string;
}) {
  const [brandName, setBrandName] = useState(defaultBrand);
  const [queriesText, setQueriesText] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("share");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [competitors, setCompetitors] = useState<CompetitorRow[]>([]);
  const [competitorUsage, setCompetitorUsage] = useState<CompetitorUsage | null>(null);
  const [comparison, setComparison] = useState<ComparisonPayload | null>(null);
  const [competitorInput, setCompetitorInput] = useState("");
  const [competitorSaving, setCompetitorSaving] = useState(false);
  const [editingCompetitorId, setEditingCompetitorId] = useState<string | null>(null);
  const [editingCompetitorName, setEditingCompetitorName] = useState("");
  const [gaps, setGaps] = useState<CitationGapRow[]>([]);
  const [suggestions, setSuggestions] = useState<ContentSuggestionRow[]>([]);
  const [outcomeSummary, setOutcomeSummary] = useState<OutcomeSummary | null>(
    null
  );
  const [suggestionMonthLimit, setSuggestionMonthLimit] = useState(3);
  const [fixesLoading, setFixesLoading] = useState(false);
  const [busyGapKey, setBusyGapKey] = useState<string | null>(null);
  const [busySuggestionId, setBusySuggestionId] = useState<string | null>(null);
  const [publishDrafts, setPublishDrafts] = useState<Record<string, string>>(
    {}
  );
  const [whyByGap, setWhyByGap] = useState<Record<string, GapAnalysisState>>(
    {}
  );

  const firstResultsMessage = useMemo(() => formatFirstResultsMessage(), []);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [shareRes, listRes, competitorRes, comparisonRes] = await Promise.all([
        fetch("/api/geo/citation-share"),
        fetch("/api/geo/tracked-queries"),
        fetch("/api/geo/competitors"),
        fetch("/api/geo/competitor-comparison"),
      ]);
      const shareJson = (await shareRes.json()) as DashboardPayload & {
        error?: string;
      };
      if (!shareRes.ok) {
        setError(shareJson.error ?? "Failed to load citation data");
        setData(null);
        return;
      }
      setData(shareJson);
      if (shareJson.brandName) {
        setBrandName((prev) => prev || shareJson.brandName || "");
      }

      if (listRes.ok) {
        const listJson = (await listRes.json()) as {
          usage?: UsageInfo;
          queries?: TrackedQueryRow[];
        };
        if (listJson.usage) setUsage(listJson.usage);
        if (listJson.queries?.length && !shareJson.trackedQueries?.length) {
          setData({ ...shareJson, trackedQueries: listJson.queries });
        }
      }
      if (competitorRes.ok) {
        const competitorJson = (await competitorRes.json()) as {
          competitors?: CompetitorRow[];
          usage?: CompetitorUsage;
        };
        setCompetitors(competitorJson.competitors ?? []);
        if (competitorJson.usage) setCompetitorUsage(competitorJson.usage);
      }

      if (comparisonRes.ok) {
        const comparisonJson = (await comparisonRes.json()) as ComparisonPayload;
        setComparison(comparisonJson);
      }

    } catch {
      setError("Could not load citation tracking");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const prompts = queriesText
      .split(/[\n,]/)
      .map((q) => q.trim())
      .filter(Boolean);

    if (!brandName.trim() || prompts.length === 0) {
      setError("Brand name and at least one query are required");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/geo/tracked-queries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName: brandName.trim(),
          prompts,
          runNow: !demoMode,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(formatLimitError({ ...json, error: json.error ?? "Failed to save tracked queries" }));
        return;
      }
      setQueriesText("");
      await loadDashboard();
    } catch {
      setError("Failed to save tracked queries");
    } finally {
      setSaving(false);
    }
  }

  async function patchQuery(
    id: string,
    patch: { active?: boolean; promptText?: string }
  ) {
    setError(null);
    try {
      const res = await fetch("/api/geo/tracked-queries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(formatLimitError({ ...json, error: json.error ?? "Failed to update query" }));
        return;
      }
      setEditingId(null);
      await loadDashboard();
    } catch {
      setError("Failed to update query");
    }
  }

  async function deleteQuery(id: string) {
    setError(null);
    try {
      const res = await fetch(
        `/api/geo/tracked-queries?id=${encodeURIComponent(id)}`,
        { method: "DELETE" }
      );
      const json = await res.json();
      if (!res.ok) {
        setError(formatLimitError({ ...json, error: json.error ?? "Failed to delete query" }));
        return;
      }
      await loadDashboard();
    } catch {
      setError("Failed to delete query");
    }
  }


  async function addCompetitor(e: React.FormEvent) {
    e.preventDefault();
    const brand = competitorInput.trim();
    if (!brand) {
      setError("Competitor brand name is required");
      return;
    }
    setCompetitorSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/geo/competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandName: brand }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(formatLimitError({ ...json, error: json.error ?? "Failed to add competitor" }));
        return;
      }
      setCompetitorInput("");
      await loadDashboard();
    } catch {
      setError("Failed to add competitor");
    } finally {
      setCompetitorSaving(false);
    }
  }

  async function saveCompetitorEdit(id: string) {
    const brandName = editingCompetitorName.trim();
    if (brandName.length < 1) return;
    setError(null);
    try {
      const res = await fetch("/api/geo/competitors", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, brandName }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(formatLimitError({ ...json, error: json.error ?? "Failed to update competitor" }));
        return;
      }
      setEditingCompetitorId(null);
      await loadDashboard();
    } catch {
      setError("Failed to update competitor");
    }
  }

  async function deleteCompetitor(id: string) {
    setError(null);
    try {
      const res = await fetch(
        `/api/geo/competitors?id=${encodeURIComponent(id)}`,
        { method: "DELETE" }
      );
      const json = await res.json();
      if (!res.ok) {
        setError(formatLimitError({ ...json, error: json.error ?? "Failed to delete competitor" }));
        return;
      }
      await loadDashboard();
    } catch {
      setError("Failed to delete competitor");
    }
  }

  const loadFixes = useCallback(async () => {
    setFixesLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/geo/suggestions");
      const json = (await res.json()) as {
        error?: string;
        gaps?: CitationGapRow[];
        suggestions?: ContentSuggestionRow[];
        outcomeSummary?: OutcomeSummary;
        usage?: { suggestionGenerationsPerMonth?: number };
      };
      if (!res.ok) {
        setError(formatLimitError({ ...json, error: json.error ?? "Failed to load citation gaps" }));
        return;
      }
      setGaps(json.gaps ?? []);
      setSuggestions(json.suggestions ?? []);
      setOutcomeSummary(json.outcomeSummary ?? null);
      if (typeof json.usage?.suggestionGenerationsPerMonth === "number") {
        setSuggestionMonthLimit(json.usage.suggestionGenerationsPerMonth);
      }
    } catch {
      setError("Failed to load citation gaps");
    } finally {
      setFixesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (view === "fixes") {
      void loadFixes();
    }
  }, [view, loadFixes]);

  function suggestionForGap(gap: CitationGapRow): ContentSuggestionRow | null {
    const matches = suggestions.filter(
      (s) =>
        s.trackedQueryId === gap.trackedQueryId &&
        s.model === gap.model &&
        s.status === "NEW"
    );
    return matches[0] ?? null;
  }

  async function generateSuggestion(gap: CitationGapRow) {
    const key = `${gap.trackedQueryId}:${gap.model}`;
    setBusyGapKey(key);
    setError(null);
    try {
      const res = await fetch("/api/geo/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackedQueryId: gap.trackedQueryId,
          model: gap.model,
        }),
      });
      const json = (await res.json()) as {
        error?: string;
        code?: string;
        upgradePath?: string;
        fairUseWarning?: string | null;
        suggestion?: ContentSuggestionRow;
      };
      if (!res.ok || !json.suggestion) {
        setError(formatLimitError({ ...json, error: json.error ?? "Could not generate suggestion" }));
        return;
      }
      setSuggestions((prev) => [json.suggestion!, ...prev]);
      if (typeof json.fairUseWarning === "string" && json.fairUseWarning) {
        setError(json.fairUseWarning);
      }
    } catch {
      setError("Could not generate suggestion");
    } finally {
      setBusyGapKey(null);
    }
  }

  async function patchSuggestion(
    id: string,
    patch: {
      status?: "DISMISSED" | "ACTIONED";
      regenerate?: boolean;
      publishedUrl?: string | null;
    }
  ) {
    setBusySuggestionId(id);
    setError(null);
    try {
      const res = await fetch("/api/geo/suggestions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      });
      const json = (await res.json()) as {
        error?: string;
        code?: string;
        upgradePath?: string;
        fairUseWarning?: string | null;
        suggestion?: ContentSuggestionRow;
      };
      if (!res.ok || !json.suggestion) {
        setError(formatLimitError({ ...json, error: json.error ?? "Could not update suggestion" }));
        return;
      }
      setSuggestions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...json.suggestion! } : s))
      );
      if (patch.publishedUrl !== undefined) {
        setPublishDrafts((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
      // Refresh summary counts after publish / status changes.
      if (patch.publishedUrl !== undefined || patch.status) {
        void loadFixes();
      }
    } catch {
      setError("Could not update suggestion");
    } finally {
      setBusySuggestionId(null);
    }
  }

  function gapReasonLabel(reason: CitationGapRow["reason"]): string {
    if (reason === "both") return "Latest miss · low mention rate";
    if (reason === "latest_miss") return "Latest run missed brand";
    return "Mention rate below 50%";
  }

  async function loadWhyPreview(gap: CitationGapRow) {
    const key = `${gap.trackedQueryId}:${gap.model}`;
    setWhyByGap((prev) => ({
      ...prev,
      [key]: { ...prev[key], loadingPreview: true, error: null },
    }));
    try {
      const params = new URLSearchParams({
        trackedQueryId: gap.trackedQueryId,
        model: gap.model,
      });
      const res = await fetch(`/api/geo/gap-analysis?${params.toString()}`);
      const json = (await res.json()) as {
        error?: string;
        preview?: {
          topDomains?: DomainTallyRow[];
          missedRunCount?: number;
        };
        analysis?: {
          analysisText?: string;
          fetchNotes?: Array<{ url: string; status: string; detail?: string }>;
          cached?: boolean;
        } | null;
      };
      if (!res.ok) {
        setWhyByGap((prev) => ({
          ...prev,
          [key]: {
            ...prev[key],
            loadingPreview: false,
            error: json.error ?? "Could not load why preview",
          },
        }));
        return;
      }
      setWhyByGap((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          loadingPreview: false,
          previewDomains: json.preview?.topDomains ?? [],
          missedRunCount: json.preview?.missedRunCount ?? 0,
          analysisText: json.analysis?.analysisText ?? prev[key]?.analysisText ?? null,
          fetchNotes: json.analysis?.fetchNotes ?? prev[key]?.fetchNotes,
          cached: json.analysis?.cached ?? prev[key]?.cached,
          error: null,
        },
      }));
    } catch {
      setWhyByGap((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          loadingPreview: false,
          error: "Could not load why preview",
        },
      }));
    }
  }

  async function generateWhyAnalysis(gap: CitationGapRow, force = false) {
    const key = `${gap.trackedQueryId}:${gap.model}`;
    setWhyByGap((prev) => ({
      ...prev,
      [key]: { ...prev[key], loadingGenerate: true, error: null },
    }));
    setError(null);
    try {
      const res = await fetch("/api/geo/gap-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackedQueryId: gap.trackedQueryId,
          model: gap.model,
          force,
        }),
      });
      const json = (await res.json()) as {
        error?: string;
        code?: string;
        upgradePath?: string;
        fairUseWarning?: string | null;
        analysis?: {
          analysisText?: string;
          topDomains?: DomainTallyRow[];
          fetchNotes?: Array<{ url: string; status: string; detail?: string }>;
          cached?: boolean;
          missedRunCount?: number;
        };
      };
      if (!res.ok || !json.analysis) {
        setWhyByGap((prev) => ({
          ...prev,
          [key]: {
            ...prev[key],
            loadingGenerate: false,
            error: json.error ?? "Could not generate analysis",
          },
        }));
        setError(
          formatLimitError({
            ...json,
            error: json.error ?? "Could not generate analysis",
          })
        );
        return;
      }
      setWhyByGap((prev) => ({
        ...prev,
        [key]: {
          loadingGenerate: false,
          loadingPreview: false,
          previewDomains:
            json.analysis!.topDomains ?? prev[key]?.previewDomains ?? [],
          missedRunCount:
            json.analysis!.missedRunCount ?? prev[key]?.missedRunCount,
          analysisText: json.analysis!.analysisText ?? null,
          fetchNotes: json.analysis!.fetchNotes,
          cached: json.analysis!.cached,
          error: null,
        },
      }));
      if (typeof json.fairUseWarning === "string" && json.fairUseWarning) {
        setError(json.fairUseWarning);
      }
    } catch {
      setWhyByGap((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          loadingGenerate: false,
          error: "Could not generate analysis",
        },
      }));
    }
  }

  const competitorAtCap =
    competitorUsage != null &&
    competitorUsage.competitorCount >= competitorUsage.competitorLimit;

  const featured =
    data?.rows.reduce<DashboardRow | null>(
      (best, row) =>
        !best || row.mentionRate > best.mentionRate ? row : best,
      null
    ) ?? null;

  const hasLiveRows = Boolean(
    data && !data.demo && data.rows.some((r) => r.total > 0)
  );
  const showDemo = Boolean(data?.demo);
  const showEmptyLive = Boolean(data && !data.demo && !hasLiveRows);
  const tracked = data?.trackedQueries ?? [];
  const atCap =
    usage != null && usage.trackedQueryCount >= usage.trackedQueryLimit;

  return (
    <Card className="bg-background" id="ai-citation-tracking">
      <CardHeader className="px-5 pb-2 pt-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground">GEO</p>
            <CardTitle className="mt-1 text-base font-medium">
              AI Citation Tracking
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Track whether ChatGPT, Perplexity, Claude, Gemini, and Grok
              mention your brand for queries you care about.
            </p>
          </div>
          {showDemo ? (
            <DataPill tone="soft">Demo stub</DataPill>
          ) : hasLiveRows ? (
            <DataPill tone="soft">Live runs</DataPill>
          ) : (
            <DataPill tone="outline">Awaiting first sweep</DataPill>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6 px-5 pb-5 pt-3">
        <form onSubmit={(e) => void handleSave(e)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="citation-brand">Brand name</Label>
            <Input
              id="citation-brand"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="Acme"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="citation-queries">Add tracked queries</Label>
            <textarea
              id="citation-queries"
              value={queriesText}
              onChange={(e) => setQueriesText(e.target.value)}
              placeholder={"best CRM for indie founders\nGEO tools for SaaS"}
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={atCap}
            />
            <p className="text-xs text-muted-foreground">
              One query per line.
              {usage
                ? ` ${usage.trackedQueryCount}/${usage.trackedQueryLimit} prompts on ${usage.planTier}.`
                : null}
              {demoMode
                ? " Demo mode will not call paid model APIs."
                : " Saving queues a live 5-model sweep."}{" "}
              <Link
                href="/onboard/citations"
                className="text-primary underline-offset-2 hover:underline"
              >
                Regenerate starter set
              </Link>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="submit"
              size="sm"
              disabled={saving || !brandName.trim() || atCap}
            >
              {saving
                ? "Saving…"
                : atCap
                  ? "Prompt limit reached"
                  : "Add queries"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={loading}
              onClick={() => void loadDashboard()}
            >
              {loading ? "Refreshing…" : "Refresh"}
            </Button>
          </div>
        </form>

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {showEmptyLive ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6">
            <p className="text-sm font-medium text-foreground">
              Waiting on the first citation sweep
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {firstResultsMessage} Sweeps run Monday and Thursday at 06:00 UTC.
              Charts appear after the first successful runs. Nothing is invented
              here.
            </p>
          </div>
        ) : null}

        {(showDemo || hasLiveRows || tracked.length > 0) && data ? (
          <div className="space-y-5">
            {(showDemo || hasLiveRows) && data.note ? (
              <p className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-muted-foreground">
                {data.note}
              </p>
            ) : null}

            <SegmentedTabs
              options={[
                { value: "share", label: "Share" },
                { value: "trend", label: "Trend" },
                { value: "urls", label: "URLs" },
                { value: "prompts", label: "Prompts" },
                { value: "competitors", label: "Competitors" },
                { value: "compare", label: "Compare" },
                { value: "fixes", label: "Fixes" },
              ]}
              value={view}
              onChange={(v) => setView(v as ViewMode)}
            />

            {view === "share" ? (
              hasLiveRows || showDemo ? (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {data.rows.map((row) => (
                      <StatCard
                        key={row.model}
                        label={row.label}
                        hint={
                          row.total > 0
                            ? `${row.mentioned}/${row.total} runs mentioned`
                            : "No runs yet"
                        }
                        value={`${row.mentionRate}%`}
                      />
                    ))}
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Brand mention sentiment
                      {data.brandName ? ` · ${data.brandName}` : ""}
                    </p>
                    <SentimentSplit
                      counts={data.sentiment}
                      emptyLabel={
                        showDemo
                          ? "Demo stub has no live sentiment."
                          : "No classified brand mentions yet. Null until the classifier succeeds."
                      }
                    />
                    {data.sentimentByModel &&
                    data.sentimentByModel.some(
                      (m) =>
                        m.counts.positive +
                          m.counts.neutral +
                          m.counts.negative +
                          m.counts.unclassified >
                        0
                    ) ? (
                      <div className="space-y-2 pt-1">
                        {data.sentimentByModel.map((m) => (
                          <div
                            key={m.model}
                            className="flex flex-wrap items-center gap-2"
                          >
                            <DataPill tone="outline">{m.label}</DataPill>
                            <SentimentSplit counts={m.counts} />
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Per-model share appears after the first live sweep.
                </p>
              )
            ) : null}

            {view === "trend" ? (
              hasLiveRows && data.trend.length >= 2 ? (
                <TrendChart
                  data={data.trend}
                  series={[
                    {
                      key: "openai",
                      label: "ChatGPT",
                      featured: featured?.model === "openai",
                    },
                    {
                      key: "perplexity",
                      label: "Perplexity",
                      featured: featured?.model === "perplexity",
                    },
                    {
                      key: "anthropic",
                      label: "Claude",
                      featured: featured?.model === "anthropic",
                    },
                    {
                      key: "gemini",
                      label: "Gemini",
                      featured: featured?.model === "gemini",
                    },
                    {
                      key: "grok",
                      label: "Grok",
                      featured: featured?.model === "grok",
                    },
                  ]}
                  xKey="date"
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {firstResultsMessage} Trend charts need at least two weekly
                  buckets of live runs. No empty chart is shown until then.
                </p>
              )
            ) : null}

            {view === "urls" ? (
              data.recentUrls.length > 0 ? (
                <ul className="space-y-2">
                  {data.recentUrls.map((url) => (
                    <li key={url}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all text-sm text-primary hover:underline"
                      >
                        {url}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No cited URLs captured yet
                  {showDemo ? " (demo stub has none)." : "."}
                </p>
              )
            ) : null}

            {view === "prompts" ? (
              tracked.length > 0 ? (
                <ul className="space-y-3">
                  {tracked.map((q) => (
                    <li
                      key={q.id}
                      className="rounded-md border border-border px-3 py-3"
                    >
                      <div className="mb-1 text-xs text-muted-foreground">
                        {q.brandName}
                        {!q.active ? " · paused" : ""}
                      </div>
                      {editingId === q.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            rows={2}
                            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          />
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() =>
                                void patchQuery(q.id, {
                                  promptText: editingText.trim(),
                                })
                              }
                              disabled={editingText.trim().length < 3}
                            >
                              Save
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => setEditingId(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm text-foreground">
                            {q.promptText}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                setEditingId(q.id);
                                setEditingText(q.promptText);
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() =>
                                void patchQuery(q.id, { active: !q.active })
                              }
                            >
                              {q.active ? "Pause" : "Resume"}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => void deleteQuery(q.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No tracked prompts yet.{" "}
                  <Link
                    href="/onboard/citations"
                    className="text-primary underline-offset-2 hover:underline"
                  >
                    Run citation onboarding
                  </Link>
                  .
                </p>
              )
            ) : null}

            {view === "competitors" ? (
              <div className="space-y-4">
                <form
                  onSubmit={(e) => void addCompetitor(e)}
                  className="flex flex-wrap gap-2"
                >
                  <Input
                    value={competitorInput}
                    onChange={(e) => setCompetitorInput(e.target.value)}
                    placeholder="Competitor brand name"
                    className="min-w-[200px] flex-1"
                    disabled={competitorAtCap}
                    maxLength={120}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={
                      competitorSaving ||
                      competitorAtCap ||
                      !competitorInput.trim()
                    }
                  >
                    {competitorSaving
                      ? "Adding…"
                      : competitorAtCap
                        ? "Limit reached"
                        : "Add competitor"}
                  </Button>
                </form>
                <p className="text-xs text-muted-foreground">
                  {competitorUsage
                    ? `${competitorUsage.competitorCount}/${competitorUsage.competitorLimit} competitors on ${competitorUsage.planTier}. `
                    : null}
                  Mentions are re-detected from existing citation responses. No extra model calls.
                </p>
                {competitors.length > 0 ? (
                  <ul className="space-y-3">
                    {competitors.map((c) => (
                      <li
                        key={c.id}
                        className="rounded-md border border-border px-3 py-3"
                      >
                        {editingCompetitorId === c.id ? (
                          <div className="flex flex-wrap gap-2">
                            <Input
                              value={editingCompetitorName}
                              onChange={(e) =>
                                setEditingCompetitorName(e.target.value)
                              }
                              maxLength={120}
                            />
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => void saveCompetitorEdit(c.id)}
                            >
                              Save
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => setEditingCompetitorId(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-medium text-foreground">
                              {c.brandName}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                  setEditingCompetitorId(c.id);
                                  setEditingCompetitorName(c.brandName);
                                }}
                              >
                                Edit
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={() => void deleteCompetitor(c.id)}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No competitors yet. Add a rival brand to open the Compare
                    view.
                  </p>
                )}
              </div>
            ) : null}

            {view === "compare" ? (
              competitors.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6">
                  <p className="text-sm font-medium text-foreground">
                    Set up competitors to compare share of voice
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Add rival brands on the Competitors tab. Comparison reuses
                    your existing citation runs. We never invent competitor
                    mentions.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    className="mt-3"
                    onClick={() => setView("competitors")}
                  >
                    Add competitors
                  </Button>
                </div>
              ) : comparison && comparison.runsAnalyzed === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6">
                  <p className="text-sm font-medium text-foreground">
                    Waiting on citation runs to compare
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {comparison.note}
                  </p>
                </div>
              ) : comparison ? (
                <div className="space-y-5">
                  <p className="text-xs text-muted-foreground">{comparison.note}</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {comparison.overall.map((row) => (
                      <StatCard
                        key={row.key}
                        label={row.isYou ? `${row.label} (you)` : row.label}
                        hint={
                          row.total > 0
                            ? `${row.mentioned}/${row.total} runs mentioned`
                            : "No analyzable runs"
                        }
                        value={`${row.mentionRate}%`}
                      />
                    ))}
                  </div>
                  {comparison.sentimentByBrand &&
                  comparison.sentimentByBrand.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        Mention sentiment by brand
                      </p>
                      {comparison.sentimentByBrand.map((row) => (
                        <div
                          key={row.key}
                          className="flex flex-wrap items-center gap-2"
                        >
                          <DataPill tone={row.isYou ? "soft" : "outline"}>
                            {row.isYou ? `${row.label} (you)` : row.label}
                          </DataPill>
                          <SentimentSplit counts={row.counts} />
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {comparison.trend.length >= 2 ? (
                    <TrendChart
                      data={comparison.trend}
                      series={[
                        {
                          key: "you",
                          label: comparison.yourBrand ?? "You",
                          featured: true,
                        },
                        ...comparison.competitors.map((c) => ({
                          key: c.id,
                          label: c.brandName,
                        })),
                      ]}
                      xKey="date"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Trend needs at least two weekly buckets of successful
                      runs. No empty chart is shown until then.
                    </p>
                  )}
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-muted-foreground">
                      Per-model breakdown
                    </p>
                    {comparison.byModel.map((modelRow) => (
                      <div key={modelRow.model} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <DataPill tone="outline">{modelRow.label}</DataPill>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {modelRow.brands.map((row) => (
                            <StatCard
                              key={`${modelRow.model}-${row.key}`}
                              label={
                                row.isYou ? `${row.label} (you)` : row.label
                              }
                              hint={
                                row.total > 0
                                  ? `${row.mentioned}/${row.total}`
                                  : "No runs"
                              }
                              value={`${row.mentionRate}%`}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Comparison data is loading…
                </p>
              )
            ) : null}

            {view === "fixes" ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    Gaps = latest successful run missed your brand, or mention
                    rate under 50% across the last 5 successful runs per model.
                    Suggestions are generated live. Failures show as errors, not
                    placeholders. Suggestion cap: {suggestionMonthLimit}/month
                    day.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={fixesLoading}
                    onClick={() => void loadFixes()}
                  >
                    {fixesLoading ? "Loading…" : "Refresh gaps"}
                  </Button>
                </div>

                <p className="rounded-md border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                  Seeing a citation after you publish does not prove your content
                  caused it. Models index slowly, and many other factors affect
                  what they cite. Treat outcomes as correlation signals, not ROI
                  proof.
                </p>

                {outcomeSummary?.showAggregate ? (
                  <p className="text-sm text-foreground">
                    Of {outcomeSummary.observedEnoughRuns} published fixes with
                    enough later runs to observe:{" "}
                    {outcomeSummary.earnedExactCitation} earned an exact-page
                    citation
                    {outcomeSummary.earnedDomainOnly > 0
                      ? `; ${outcomeSummary.earnedDomainOnly} saw the same domain cited on a different page`
                      : ""}
                    . Exact and domain matches are counted separately.
                  </p>
                ) : null}

                {showEmptyLive || (!hasLiveRows && !showDemo) ? (
                  <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6">
                    <p className="text-sm font-medium text-foreground">
                      No citation runs to find gaps yet
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {firstResultsMessage} Fixes appear after successful model
                      runs show a miss or low mention rate. We never invent gaps.
                    </p>
                  </div>
                ) : gaps.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6">
                    <p className="text-sm font-medium text-foreground">
                      No citation gaps right now
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Every active prompt with successful runs is currently above
                      the 50% mention threshold and the latest run mentioned your
                      brand. Check back after the next Mon/Thu sweep.
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {gaps.map((gap) => {
                      const key = `${gap.trackedQueryId}:${gap.model}`;
                      const suggestion = suggestionForGap(gap);
                      const generating = busyGapKey === key;
                      return (
                        <li
                          key={key}
                          className="rounded-md border border-border px-3 py-3"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <DataPill tone="outline">{gap.modelLabel}</DataPill>
                            <DataPill tone="soft">
                              {gap.mentionRate}% · {gap.mentioned}/
                              {gap.runsConsidered}
                            </DataPill>
                            <span className="text-xs text-muted-foreground">
                              {gapReasonLabel(gap.reason)}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-foreground">
                            {gap.promptText}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Brand: {gap.brandName}
                          </p>

                          {suggestion ? (
                            <div className="mt-3 space-y-3">
                              <pre className="whitespace-pre-wrap rounded-md bg-muted/40 px-3 py-2 font-sans text-sm text-foreground">
                                {suggestion.suggestionText}
                              </pre>
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="secondary"
                                  disabled={busySuggestionId === suggestion.id}
                                  onClick={() =>
                                    void patchSuggestion(suggestion.id, {
                                      regenerate: true,
                                    })
                                  }
                                >
                                  {busySuggestionId === suggestion.id
                                    ? "Working…"
                                    : "Regenerate"}
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="secondary"
                                  disabled={busySuggestionId === suggestion.id}
                                  onClick={() =>
                                    void patchSuggestion(suggestion.id, {
                                      status: "ACTIONED",
                                    })
                                  }
                                >
                                  Mark actioned
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="secondary"
                                  disabled={busySuggestionId === suggestion.id}
                                  onClick={() =>
                                    void patchSuggestion(suggestion.id, {
                                      status: "DISMISSED",
                                    })
                                  }
                                >
                                  Dismiss
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-3">
                              <Button
                                type="button"
                                size="sm"
                                disabled={generating}
                                onClick={() => void generateSuggestion(gap)}
                              >
                                {generating
                                  ? "Generating…"
                                  : "Generate content brief"}
                              </Button>
                            </div>
                          )}

                          {(() => {
                            const why = whyByGap[key];
                            return (
                              <div className="mt-4 space-y-2 border-t border-border pt-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <p className="text-xs font-medium text-foreground">
                                    Why wasn’t I cited?
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="secondary"
                                      disabled={why?.loadingPreview}
                                      onClick={() => void loadWhyPreview(gap)}
                                    >
                                      {why?.loadingPreview
                                        ? "Loading domains…"
                                        : why?.previewDomains
                                          ? "Refresh domains"
                                          : "Show cited domains"}
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      disabled={
                                        why?.loadingGenerate ||
                                        !(
                                          why?.previewDomains &&
                                          why.previewDomains.length > 0
                                        )
                                      }
                                      onClick={() =>
                                        void generateWhyAnalysis(gap, false)
                                      }
                                    >
                                      {why?.loadingGenerate
                                        ? "Analysing…"
                                        : why?.analysisText
                                          ? "Refresh analysis"
                                          : "Explain gap"}
                                    </Button>
                                  </div>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Domains come from stored citation runs where
                                  your brand was missed — no new model calls.
                                  Analysis is on-demand (shares your monthly
                                  suggestion quota) and only describes pages we
                                  could actually fetch.
                                </p>
                                {why?.error ? (
                                  <p className="text-xs text-destructive">
                                    {why.error}
                                  </p>
                                ) : null}
                                {why?.previewDomains &&
                                why.previewDomains.length > 0 ? (
                                  <ul className="space-y-1 text-xs text-muted-foreground">
                                    {why.previewDomains.slice(0, 6).map((d) => (
                                      <li key={d.domain}>
                                        <span className="text-foreground">
                                          {d.domain}
                                        </span>{" "}
                                        · {d.count}× ·{" "}
                                        {d.models.join(", ") || "unknown model"}
                                      </li>
                                    ))}
                                  </ul>
                                ) : why?.previewDomains ? (
                                  <p className="text-xs text-muted-foreground">
                                    No cited URLs on missed runs for this query
                                    yet.
                                  </p>
                                ) : null}
                                {why?.analysisText ? (
                                  <div className="space-y-2">
                                    <pre className="whitespace-pre-wrap rounded-md bg-muted/30 px-3 py-2 font-sans text-sm text-foreground">
                                      {why.analysisText}
                                    </pre>
                                    {why.cached ? (
                                      <p className="text-xs text-muted-foreground">
                                        Cached analysis — regenerate only if
                                        cited domains change or you force a
                                        refresh.
                                      </p>
                                    ) : null}
                                    {why.fetchNotes &&
                                    why.fetchNotes.length > 0 ? (
                                      <ul className="space-y-1 text-xs text-muted-foreground">
                                        {why.fetchNotes.map((n) => (
                                          <li key={n.url} className="break-all">
                                            {n.status}: {n.url}
                                            {n.detail ? ` (${n.detail})` : ""}
                                          </li>
                                        ))}
                                      </ul>
                                    ) : null}
                                    <p className="text-xs text-muted-foreground">
                                      Next step: use Generate content brief above
                                      to turn this gap into a fix suggestion.
                                    </p>
                                  </div>
                                ) : null}
                              </div>
                            );
                          })()}
                        </li>
                      );
                    })}
                  </ul>
                )}

                {(() => {
                  const actioned = suggestions.filter(
                    (s) => s.status === "ACTIONED"
                  );
                  if (actioned.length === 0) return null;
                  return (
                    <div className="space-y-3 border-t border-border pt-4">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Published outcomes
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Paste the URL after you publish. We check later citation
                          runs for that page (exact) or just your domain (weaker).
                          AI models index slowly. “Not yet cited” after a few runs
                          is normal, not failure.
                        </p>
                      </div>
                      <ul className="space-y-3">
                        {actioned.map((suggestion) => {
                          const threshold =
                            suggestion.awaitingRunThreshold ?? 3;
                          const exactOutcomes = (suggestion.outcomes ?? []).filter(
                            (o) => o.matchType === "EXACT"
                          );
                          const domainOutcomes = (
                            suggestion.outcomes ?? []
                          ).filter((o) => o.matchType === "DOMAIN");
                          let statusLabel = "Paste published URL";
                          let statusDetail =
                            "Mark where you published so we can watch later runs.";
                          if (suggestion.outcomeStatus === "awaiting") {
                            statusLabel = "Published · awaiting data";
                            statusDetail = `${suggestion.runsAfterPublish} successful run${suggestion.runsAfterPublish === 1 ? "" : "s"} since publish (need ${threshold} before we call it “not yet cited”). Models often take longer to index new pages.`;
                          } else if (suggestion.outcomeStatus === "cited_exact") {
                            statusLabel = "Cited (exact page)";
                            statusDetail =
                              "Your published URL appeared in cited URLs. That is a correlation signal, not proof the content caused it.";
                          } else if (
                            suggestion.outcomeStatus === "cited_domain_only"
                          ) {
                            statusLabel = "Domain cited (not this page)";
                            statusDetail =
                              "A URL on the same domain was cited, but not this exact path. Separate, weaker signal than an exact-page match.";
                          } else if (
                            suggestion.outcomeStatus === "not_yet_cited"
                          ) {
                            statusLabel = `Not yet cited after ${suggestion.runsAfterPublish} runs`;
                            statusDetail =
                              "Still not failure. Indexing can take weeks. Keep publishing and checking after future sweeps.";
                          }

                          return (
                            <li
                              key={suggestion.id}
                              className="rounded-md border border-border px-3 py-3"
                            >
                              <div className="flex flex-wrap items-center gap-2">
                                <DataPill tone="outline">
                                  {FIX_MODEL_LABELS[suggestion.model] ??
                                    suggestion.model}
                                </DataPill>
                                <DataPill tone="soft">{statusLabel}</DataPill>
                              </div>
                              <p className="mt-2 text-sm text-foreground">
                                {suggestion.promptText}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {statusDetail}
                              </p>
                              {suggestion.publishedUrl ? (
                                <p className="mt-2 break-all text-xs text-muted-foreground">
                                  Watching: {suggestion.publishedUrl}
                                </p>
                              ) : (
                                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
                                  <div className="min-w-0 flex-1 space-y-1">
                                    <Label htmlFor={`pub-${suggestion.id}`}>
                                      Published URL
                                    </Label>
                                    <Input
                                      id={`pub-${suggestion.id}`}
                                      type="url"
                                      placeholder="https://yoursite.com/post"
                                      value={
                                        publishDrafts[suggestion.id] ?? ""
                                      }
                                      onChange={(e) =>
                                        setPublishDrafts((prev) => ({
                                          ...prev,
                                          [suggestion.id]: e.target.value,
                                        }))
                                      }
                                    />
                                  </div>
                                  <Button
                                    type="button"
                                    size="sm"
                                    disabled={
                                      busySuggestionId === suggestion.id ||
                                      !(
                                        publishDrafts[suggestion.id] ?? ""
                                      ).trim()
                                    }
                                    onClick={() =>
                                      void patchSuggestion(suggestion.id, {
                                        publishedUrl:
                                          publishDrafts[suggestion.id] ?? "",
                                      })
                                    }
                                  >
                                    {busySuggestionId === suggestion.id
                                      ? "Saving…"
                                      : "Save URL"}
                                  </Button>
                                </div>
                              )}
                              {exactOutcomes.length > 0 ? (
                                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                                  {exactOutcomes.map((o) => (
                                    <li key={o.id}>
                                      Exact ·{" "}
                                      {FIX_MODEL_LABELS[o.model] ?? o.model} ·{" "}
                                      {formatOutcomeWhen(o.matchedAt)}
                                    </li>
                                  ))}
                                </ul>
                              ) : null}
                              {domainOutcomes.length > 0 ? (
                                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                                  {domainOutcomes.map((o) => (
                                    <li key={o.id}>
                                      Domain only ·{" "}
                                      {FIX_MODEL_LABELS[o.model] ?? o.model} ·{" "}
                                      {formatOutcomeWhen(o.matchedAt)}
                                    </li>
                                  ))}
                                </ul>
                              ) : null}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })()}
              </div>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
