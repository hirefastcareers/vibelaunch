"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

type AlertsSummary = { unreadCount: number };

/** Compact unread badge linking to the alerts feed. */
export function AlertsBell({ className }: { className?: string }) {
  const [unread, setUnread] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/alerts?unread=1");
      if (!res.ok) return;
      const data = (await res.json()) as AlertsSummary;
      setUnread(data.unreadCount ?? 0);
    } catch {
      // best-effort
    }
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 60_000);
    return () => window.clearInterval(id);
  }, [load]);

  const count = unread ?? 0;

  return (
    <Link
      href="/dashboard/alerts"
      className={cn(
        "relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-foreground hover:bg-muted",
        className
      )}
      aria-label={
        count > 0 ? `${count} unread citation alerts` : "Citation alerts"
      }
    >
      <Bell className="h-4 w-4" />
      {count > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </Link>
  );
}
