"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Check } from "lucide-react";
import Link from "next/link";

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
      <div className="p-8 space-y-6">
        <Skeleton className="h-10 w-64" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <div>
        <p className="font-mono text-[10px] tracking-widest text-muted-foreground mb-1">
          REPLIES
        </p>
        <h1 className="text-5xl">Smart Reply Assistant</h1>
        <p className="mt-1 max-w-[56ch] text-sm text-muted-foreground">
          Turn relevant mentions into warm replies. When the live feed is wired, this page becomes a lightweight reply queue instead of an empty tool screen.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.35fr_0.95fr]">
        <Card>
          <CardHeader className="border-b border-border pb-4">
            <p className="font-mono text-[10px] tracking-widest text-muted-foreground">
              WORKFLOW
            </p>
            <CardTitle className="mt-1 text-[24px]">How replies should work</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-px p-0 md:grid-cols-3">
            <div className="bg-background px-5 py-5">
              <p className="font-mono text-[10px] tracking-widest text-muted-foreground">01</p>
              <h2 className="mt-2 text-[21px]">Track</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Watch targeted keywords and competitor-adjacent conversations.
              </p>
            </div>
            <div className="bg-card px-5 py-5">
              <p className="font-mono text-[10px] tracking-widest text-muted-foreground">02</p>
              <h2 className="mt-2 text-[21px]">Draft</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Generate helpful replies with enough product context to sound human.
              </p>
            </div>
            <div className="bg-background px-5 py-5">
              <p className="font-mono text-[10px] tracking-widest text-muted-foreground">03</p>
              <h2 className="mt-2 text-[21px]">Respond</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Copy or post only the replies worth sending. Volume should never beat quality.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border pb-4">
            <p className="font-mono text-[10px] tracking-widest text-muted-foreground">
              READINESS
            </p>
            <CardTitle className="mt-1 text-[24px]">Integration status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <div className="rounded-lg border border-border bg-background px-4 py-3">
              <p className="font-mono text-[10px] tracking-widest text-muted-foreground">X API FEED</p>
              <p className="mt-1 text-sm text-foreground">{configured ? "Connected" : "Not connected yet"}</p>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              This screen is intentionally honest. The feed stays empty until the live X ingestion path is wired.
            </p>
            <Link
              href="/onboard"
              className="inline-block border-b border-border font-mono text-[11px] tracking-wider text-muted-foreground hover:text-foreground"
            >
              REVIEW PROJECT SETUP
            </Link>
          </CardContent>
        </Card>
      </div>

      {Object.keys(feeds).length === 0 && (
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="font-mono text-[10px] tracking-widest text-muted-foreground mb-1">
            {configured ? "EMPTY" : "NOT CONFIGURED"}
          </p>
          <h2 className="text-2xl">No live feed</h2>
          <p className="mt-1 max-w-[48ch] text-sm text-muted-foreground">
            Smart replies are not wired to a live mention feed yet. Connect the X ingestion path before treating this as an active workflow.
          </p>
        </div>
      )}

      {Object.entries(feeds).map(([keyword, items]) => (
        <Card key={keyword}>
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
                  className="rounded-lg border border-border p-4 space-y-3"
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
    </div>
  );
}
