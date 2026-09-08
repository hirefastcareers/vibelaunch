"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Copy, ExternalLink, RefreshCw } from "lucide-react";
import Link from "next/link";
import { DashboardPage, PageHeader } from "@/components/dashboard-page";

interface FeedItem {
  id: string;
  author: string;
  content: string;
  url: string;
  suggestedReply?: string;
}

type Feeds = Record<string, FeedItem[]>;

interface FeedResponse {
  feeds?: Feeds;
  configured?: boolean;
  keywords?: string[];
  projectName?: string | null;
  reason?: string;
  errors?: string[];
}

export default function RepliesPage() {
  const [feeds, setFeeds] = useState<Feeds>({});
  const [configured, setConfigured] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [projectName, setProjectName] = useState<string | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  const [feedErrors, setFeedErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [posting, setPosting] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [posted, setPosted] = useState<Record<string, string>>({});
  const [actionError, setActionError] = useState<string | null>(null);

  async function loadFeed(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setActionError(null);

    try {
      const res = await fetch("/api/replies/feed");
      const data = (await res.json()) as FeedResponse;
      if (!res.ok) {
        setActionError(
          typeof data === "object" && data && "error" in data
            ? String((data as { error?: string }).error)
            : "Could not load the replies feed."
        );
        return;
      }

      setFeeds(data.feeds ?? {});
      setConfigured(data.configured ?? false);
      setKeywords(data.keywords ?? []);
      setProjectName(data.projectName ?? null);
      setReason(data.reason ?? null);
      setFeedErrors(data.errors ?? []);

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
  }

  useEffect(() => {
    void loadFeed();
  }, []);

  async function generateReply(keyword: string, item: FeedItem) {
    const key = `${keyword}-${item.id}`;
    setGenerating(key);
    setActionError(null);

    try {
      const res = await fetch("/api/replies/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalPost: item.content,
          keyword,
          projectName: projectName ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.reply) {
        setActionError(data.error ?? "Could not generate a reply.");
        return;
      }
      setDrafts((prev) => ({ ...prev, [key]: data.reply }));
    } finally {
      setGenerating(null);
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

  async function postReply(keyword: string, item: FeedItem) {
    const key = `${keyword}-${item.id}`;
    const content = drafts[key]?.trim();
    if (!content) return;

    setPosting(key);
    setActionError(null);

    try {
      const res = await fetch("/api/replies/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          inReplyToTweetId: item.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error ?? "Could not post the reply to X.");
        return;
      }
      if (data.url) {
        setPosted((prev) => ({ ...prev, [key]: data.url }));
      }
    } finally {
      setPosting(null);
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
        description={
          configured
            ? "Find relevant conversations and draft warm replies worth sending."
            : "Turn relevant mentions into warm replies once the live X feed is connected."
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
                Watch your project keywords and @mentions on X.
              </p>
            </div>
            <div className="bg-card px-5 py-5">
              <p className="text-xs font-medium text-muted-foreground">2</p>
              <h2 className="mt-2 text-[21px]">Draft</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Generate helpful replies with enough product context to sound human.
              </p>
            </div>
            <div className="bg-background px-5 py-5">
              <p className="text-xs font-medium text-muted-foreground">3</p>
              <h2 className="mt-2 text-[21px]">Respond</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Copy or post only the replies worth sending. Volume should never beat quality.
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
              <p className="text-xs font-medium text-muted-foreground">X API feed</p>
              <p className="mt-1 text-sm text-foreground">
                {configured ? "Connected" : "Not connected yet"}
              </p>
            </div>
            {keywords.length > 0 && (
              <div className="rounded-lg border border-border bg-background px-4 py-3">
                <p className="text-xs font-medium text-muted-foreground">Tracking</p>
                <p className="mt-1 text-sm text-foreground">{keywords.join(" · ")}</p>
              </div>
            )}
            <p className="text-sm leading-relaxed text-muted-foreground">
              {configured
                ? reason ??
                  "Live recent search pulls from your project keywords. Mentions use your connected X account."
                : reason ??
                  "Connect X sign-in (and optionally an app bearer via X_API_KEY) to load conversations."}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => void loadFeed(true)}
                disabled={refreshing}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                {refreshing ? "Refreshing..." : "Refresh feed"}
              </Button>
              <Link
                href="/onboard"
                className="text-sm font-medium text-primary hover:underline"
              >
                Review project setup
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {actionError && (
        <div className="rounded-xl border border-border bg-card px-5 py-4 text-sm text-muted-foreground">
          {actionError}
        </div>
      )}

      {feedErrors.length > 0 && (
        <div className="rounded-xl border border-border bg-card px-5 py-4 text-sm text-muted-foreground">
          Some searches failed: {feedErrors.join(" · ")}
        </div>
      )}

      {Object.keys(feeds).length === 0 && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <p className="mb-1 text-xs font-medium text-muted-foreground">
            {configured ? "Empty" : "Not configured"}
          </p>
          <h2 className="text-base font-medium">
            {configured ? "No recent conversations" : "No live feed"}
          </h2>
          <p className="mt-1 max-w-[48ch] text-sm text-muted-foreground">
            {configured
              ? keywords.length > 0
                ? "Nothing matched your keywords in the last few days. Try broader keywords on onboard, or check back later."
                : "Add keywords when you onboard a project so we know which conversations to watch."
              : "Smart replies need a connected X account (or X_API_KEY / X_BEARER_TOKEN) before this becomes an active workflow."}
          </p>
        </div>
      )}

      {feedCount > 0 && (
        <p className="text-sm text-muted-foreground">
          {feedCount} conversation{feedCount === 1 ? "" : "s"} across {Object.keys(feeds).length}{" "}
          topic{Object.keys(feeds).length === 1 ? "" : "s"}
        </p>
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
                  <div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-mono text-sm text-muted-foreground">
                        {item.author}
                      </span>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        View on X
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <p className="mt-1 text-sm text-foreground/90">{item.content}</p>
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
                        maxLength={280}
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => copyDraft(key)}>
                          {copied === key ? (
                            <>
                              <Check className="h-3.5 w-3.5" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              Copy Reply
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void postReply(keyword, item)}
                          disabled={posting === key || Boolean(postedUrl)}
                        >
                          {postedUrl
                            ? "Posted"
                            : posting === key
                              ? "Posting..."
                              : "Post to X"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => void generateReply(keyword, item)}
                          disabled={generating === key}
                        >
                          Regenerate
                        </Button>
                      </div>
                      {postedUrl && (
                        <a
                          href={postedUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                          Open your reply
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
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
