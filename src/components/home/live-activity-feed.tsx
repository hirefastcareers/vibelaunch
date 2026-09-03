"use client";

import { useEffect, useState } from "react";
import { FileText, RefreshCw, Send, Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityItem {
  id: number;
  icon: typeof Send;
  text: string;
  time: string;
  type: "post" | "seo" | "citation" | "audit";
}

const TYPE_STYLES = {
  post: "bg-primary/10 text-primary",
  seo: "bg-muted text-foreground",
  citation: "bg-green-50 text-green-700",
  audit: "bg-amber-50 text-amber-700",
} as const;

const FEED_ITEMS: ActivityItem[] = [
  { id: 1, icon: Send, text: "Post shipped to X with hook score 0.81", time: "2m ago", type: "post" },
  { id: 2, icon: FileText, text: "Article indexed: /changelog/v1-4-media", time: "14m ago", type: "seo" },
  { id: 3, icon: Target, text: "Cited by Perplexity at position #2", time: "1h ago", type: "citation" },
  { id: 4, icon: RefreshCw, text: "Health audit passed: 12/12 pages indexed", time: "3h ago", type: "audit" },
  { id: 5, icon: Send, text: "Thread 1/4 queued for the next publish window", time: "4h ago", type: "post" },
  { id: 6, icon: Target, text: "Cited by ChatGPT at position #1", time: "6h ago", type: "citation" },
  { id: 7, icon: FileText, text: "Pillar page crawled by Google", time: "8h ago", type: "seo" },
  { id: 8, icon: Send, text: "Post reinforced after ERI improved to 2.3", time: "12h ago", type: "post" },
];

export function LiveActivityFeed() {
  const [visible, setVisible] = useState(4);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisible((v) => Math.min(v + 1, FEED_ITEMS.length));
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const items = FEED_ITEMS.slice(0, visible);

  return (
    <div className="ds-card-flat">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
        </span>
        <h3 className="text-lg">Example activity</h3>
        <span className="ds-label ml-auto">Sample</span>
      </div>
      <div className="space-y-0">
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className={cn(
                "flex items-start gap-3 border-b border-border py-3 last:border-0",
                i === 0 && "animate-slide-up"
              )}
            >
              <span
                className={cn(
                  "mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                  TYPE_STYLES[item.type]
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug text-foreground">{item.text}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{item.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
