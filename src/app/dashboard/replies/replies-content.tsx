"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Check } from "lucide-react";

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
    <div className="p-6 space-y-6">
      <div>
        <p className="font-mono text-[10px] tracking-widest text-muted-foreground mb-1">
          REPLIES
        </p>
        <h1 className="text-4xl">Smart Reply Assistant</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Monitor keyword feeds and generate context-aware, non-spammy replies
        </p>
      </div>

      {Object.keys(feeds).length === 0 && (
        <div className="rounded-sm border border-border bg-card p-6">
          <p className="font-mono text-[10px] tracking-widest text-muted-foreground mb-1">
            {configured ? "EMPTY" : "NOT CONFIGURED"}
          </p>
          <h2 className="text-2xl">No live feed</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Smart replies aren't connected to a live feed yet. Add X API
            credentials to start tracking keyword mentions.
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
                  className="rounded-sm border border-border p-4 space-y-3"
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
