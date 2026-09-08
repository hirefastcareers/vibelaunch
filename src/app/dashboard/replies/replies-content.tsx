"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Check, ExternalLink, RefreshCw } from "lucide-react";
import Link from "next/link";
import { DashboardPage, PageHeader } from "@/components/dashboard-page";

interface FeedItem {
  id: string;
  author: string;
  content: string;
  url: string;
  suggestedReply?: string;
  createdAt?: string;
}

type Feeds = Record<string, FeedItem[]>;

interface FeedResponse {
  feeds?: Feeds;
  configured?: boolean;
  sources?: { mentions?: boolean; keywords?: boolean };
  project?: { id: string; name: string; keywords: string[] } | null;
  warning?: string;
  error?: string;
}

export default function RepliesPage() {
  const [feeds, setFeeds] = useState<Feeds>({});
  const [configured, setConfigured] = useState(false);
  const [sources, setSources] = useState({ mentions: false, keywords: false });
  const [project, setProject] = useState<FeedResponse["project"]>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [posting, setPosting] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [posted, setPosted] = useState<Record<string, string>>({});
  const [actionError, setActionError] = useState<Record<string, string>>({});

  const loadFeed = useCallback(async (mode: "initial" | "refresh" = "initial") => {
    if (mode === "refresh") setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch("/api/replies/feed");
      const data = (await res.json()) as FeedResponse;
      if (!res.ok) {
        setFeeds({});
        setConfigured(false);
        setWarning(data.error ?? "Could not load replies feed.");
        return;
      }

      setFeeds(data.feeds ?? {});
      setConfigured(Boolean(data.configured));
      setSources({
        mentions: Boolean(data.sources?.mentions),
        keywords: Boolean(data.sources?.keywords),
      });
      setProject(data.project ?? null);
      setWarning(data.warning ?? null);

      const prefill: Record<string, string> = {};
      for (const [keyword, items] of Object.entries(data.feeds ?? {})) {
        for (const item of items) {
          if (item.suggestedReply) {
            prefill[`${keyword}-${item.id}`] = item.suggestedReply;
          }
        }
      }
      if (Object.keys(prefill).length > 0) {
        setDrafts((prev) => ({ ...prefill, ...prev }));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadFeed("initial");
  }, [loadFeed]);

  async function generateReply(keyword: string, item: FeedItem) {
    const key = `${keyword}-${item.id}`;
    setGenerating(key);
    setActionError((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });

    try {
      const res = await fetch("/api/replies/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalPost: item.content,
          keyword,
          projectId: project?.id,
          projectName: project?.name,
        }),
      });
      const data = await res.json();
      if (data.reply) {
        setDrafts((prev) => ({ ...prev, [key]: data.reply }));
      } else {
        setActionError((prev) => ({
          ...prev,
          [key]: data.error ?? "Could not generate a reply.",
        }));
      }
    } finally {
      setGenerating(null);
    }
  }

  async function postReply(keyword: string, item: FeedItem) {
    const key = `${keyword}-${item.id}`;
    const reply = drafts[key]?.trim();
    if (!reply) return;

    setPosting(key);
    setActionError((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });

    try {
      const res = await fetch("/api/replies/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tweetId: item.id, reply }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionError((prev) => ({
          ...prev,
          [key]: data.error ?? "Failed to post reply.",
        }));
        return;
      }
      if (data.url) {
        setPosted((prev) => ({ ...prev, [key]: data.url }));
      }
    } finally {
      setPosting(null);
    }
  }

  function copyDraft(key: string) {
    const text = drafts[key];
    if (text) {
      navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    }
  }

  if (loading) {
    return (
      <DashboardPage>
        <Skeleton className="h-8 w-64" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </DashboardPage>
    );
  }

  const feedCount = Object.values(feeds).reduce((n, items) => n + items.length, 0);

  return (
    <DashboardPage>
      <PageHeader
        title="Replies"
        description="Turn mentions and keyword conversations into warm, specific replies."
        actions={
          <Button
            size="sm"
            variant="outline"
            onClick={() => void loadFeed("refresh")}
            disabled={refreshing}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing" : "Refresh"}
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.35fr_0.95fr]">
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border pb-4">
            <p className="text-xs font-medium text-muted-foreground">Workflow</p>
            <CardTitle className="mt-1 text-base font-medium">How replies work</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-px p-0 md:grid-cols-3">
            <div className="bg-background px-5 py-5">
              <p className="text-xs font-medium text-muted-foreground">1</p>
              <h2 className="mt-2 text-[21px]">Track</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Pull live @mentions plus project keyword searches when a bearer token is set.
              </p>
            </div>
            <div className="bg-card px-5 py-5">
              <p className="text-xs font-medium text-muted-foreground">2</p>
              <h2 className="mt-2 text-[21px]">Draft</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Generate helpful replies with your product context so they sound human.
              </p>
            </div>
            <div className="bg-background px-5 py-5">
              <p className="text-xs font-medium text-muted-foreground">3</p>
              <h2 className="mt-2 text-[21px]">Respond</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Copy or post only the replies worth sending. Quality beats volume.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border pb-4">
            <p className="text-xs font-medium text-muted-foreground">Status</p>
            <CardTitle className="mt-1 text-base font-medium">Integration status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <div className="rounded-lg border border-border bg-background px-4 py-3">
              <p className="text-xs font-medium text-muted-foreground">X mentions</p>
              <p className="mt-1 text-sm text-foreground">
                {sources.mentions ? "Connected" : "Not connected"}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-background px-4 py-3">
              <p className="text-xs font-medium text-muted-foreground">Keyword search</p>
              <p className="mt-1 text-sm text-foreground">
                {sources.keywords
                  ? "Connected"
                  : project?.keywords?.length
                    ? "Needs X_BEARER_TOKEN"
                    : "Add project keywords"}
              </p>
            </div>
            {project ? (
              <p className="text-sm text-muted-foreground">
                Using project context from {project.name}.
              </p>
            ) : (
              <Link href="/onboard" className="text-sm font-medium text-primary hover:underline">
                Add a project for product-aware drafts
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      {warning ? (
        <div className="rounded-xl border border-border bg-card px-5 py-4 text-sm text-muted-foreground">
          {warning}
        </div>
      ) : null}

      {feedCount === 0 && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <p className="mb-1 text-xs font-medium text-muted-foreground">
            {configured ? "Empty" : "Not configured"}
          </p>
          <h2 className="text-base font-medium">
            {configured ? "No mentions right now" : "Connect X to load replies"}
          </h2>
          <p className="mt-1 max-w-[52ch] text-sm text-muted-foreground">
            {configured
              ? "Your mentions inbox is live. When someone tags you, or keyword search finds a thread, it will show up here."
              : "Sign in with X so we can read your mentions. Optionally set X_BEARER_TOKEN to search project keywords too."}
          </p>
          {!configured ? (
            <Link
              href="/auth/signin"
              className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
            >
              Sign in with X
            </Link>
          ) : null}
        </div>
      )}

      {Object.entries(feeds).map(([keyword, items]) => (
        <Card key={keyword} className="overflow-hidden">
          <CardHeader>
            <CardTitle className="font-mono text-sm tracking-wider">{keyword}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item) => {
              const key = `${keyword}-${item.id}`;
              const draft = drafts[key];
              const postedUrl = posted[key];

              return (
                <div
                  key={item.id}
                  className="space-y-3 rounded-xl border border-border bg-background p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="font-mono text-sm text-muted-foreground">
                        {item.author}
                      </span>
                      <p className="mt-1 text-sm text-foreground/90">{item.content}</p>
                    </div>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 text-muted-foreground hover:text-foreground"
                      aria-label="Open on X"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>

                  {!draft ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void generateReply(keyword, item)}
                      disabled={generating === key}
                    >
                      {generating === key ? "Generating..." : "Generate reply"}
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <Textarea
                        value={draft}
                        onChange={(e) =>
                          setDrafts((prev) => ({ ...prev, [key]: e.target.value }))
                        }
                        rows={3}
                        className="text-sm"
                        disabled={Boolean(postedUrl)}
                      />
                      <div className="flex flex-wrap gap-2">
                        {postedUrl ? (
                          <a
                            href={postedUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium text-primary hover:underline"
                          >
                            View on X
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              onClick={() => void postReply(keyword, item)}
                              disabled={posting === key || !draft.trim()}
                            >
                              {posting === key ? "Posting..." : "Post reply"}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => copyDraft(key)}>
                              {copied === key ? (
                                <>
                                  <Check className="h-3.5 w-3.5" />
                                  Copied
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3.5 w-3.5" />
                                  Copy
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => void generateReply(keyword, item)}
                              disabled={generating === key}
                            >
                              Regenerate
                            </Button>
                          </>
                        )}
                      </div>
                      {actionError[key] ? (
                        <p className="text-sm text-muted-foreground">{actionError[key]}</p>
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </DashboardPage>
  );
}
