"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Check } from "lucide-react";
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

export default function RepliesPage() {
  const [feeds, setFeeds] = useState<Feeds>({});
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/replies/feed")
      .then((r) => r.json())
      .then((data) => {
        setFeeds(data.feeds ?? {});
        setConfigured(data.configured ?? false);
        const prefill: Record<string, string> = {};
        for (const [keyword, items] of Object.entries(data.feeds ?? {})) {
          for (const item of items as FeedItem[]) {
            if (item.suggestedReply) {
              prefill[`${keyword}-${item.id}`] = item.suggestedReply;
            }
          }
        }
        setDrafts(prefill);
      })
      .finally(() => setLoading(false));
  }, []);

  async function generateReply(keyword: string, item: FeedItem) {
    const key = `${keyword}-${item.id}`;
    setGenerating(key);

    try {
      const res = await fetch("/api/replies/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalPost: item.content,
          keyword,
        }),
      });
      const data = await res.json();
      if (data.reply) {
        setDrafts((prev) => ({ ...prev, [key]: data.reply }));
      }
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

  return (
    <DashboardPage>
      <PageHeader
        title="Replies"
        description="Turn relevant mentions into warm replies. This stays empty until the live X feed is wired."
      />

      <div className="grid gap-4 lg:grid-cols-[1.35fr_0.95fr]">
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border pb-4">
            <p className="text-xs font-medium text-muted-foreground">Workflow</p>
            <CardTitle className="mt-1 text-base font-medium">How replies should work</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-px p-0 md:grid-cols-3">
            <div className="bg-background px-5 py-5">
              <p className="text-xs font-medium text-muted-foreground">1</p>
              <h2 className="mt-2 text-[21px]">Track</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Watch targeted keywords and competitor-adjacent conversations.
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
              <p className="mt-1 text-sm text-foreground">{configured ? "Connected" : "Not connected yet"}</p>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              This screen is intentionally honest. The feed stays empty until the live X ingestion path is wired.
            </p>
            <Link
              href="/onboard"
              className="text-sm font-medium text-primary hover:underline"
            >
              Review project setup
            </Link>
          </CardContent>
        </Card>
      </div>

      {Object.keys(feeds).length === 0 && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground mb-1">
            {configured ? "Empty" : "Not configured"}
          </p>
          <h2 className="text-base font-medium">No live feed</h2>
          <p className="mt-1 max-w-[48ch] text-sm text-muted-foreground">
            Smart replies are not wired to a live mention feed yet. Connect the X ingestion path before treating this as an active workflow.
          </p>
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

              return (
                <div
                  key={item.id}
                  className="space-y-3 rounded-xl border border-border bg-background p-4 shadow-sm"
                >
                  <div>
                    <span className="text-sm font-mono text-muted-foreground">{item.author}</span>
                    <p className="text-sm mt-1 text-foreground/90">{item.content}</p>
                  </div>

                  {!draft ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => generateReply(keyword, item)}
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
                      />
                      <div className="flex gap-2">
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
                          variant="ghost"
                          onClick={() => generateReply(keyword, item)}
                        >
                          Regenerate
                        </Button>
                      </div>
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
