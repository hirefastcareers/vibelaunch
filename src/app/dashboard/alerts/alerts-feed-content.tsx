"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Settings } from "lucide-react";
import { DashboardPage, PageHeader } from "@/components/dashboard-page";
import { StatusPill } from "@/components/status-pill";

type AlertRow = {
  id: string;
  type: string;
  detail: Record<string, unknown>;
  createdAt: string;
  readAt: string | null;
  deliveredAt: string | null;
  deliverySkippedReason: string | null;
  brandName: string | null;
  promptText: string | null;
};

function typeLabel(type: string): string {
  switch (type) {
    case "CITATION_LOST":
      return "Citation lost";
    case "CITATION_GAINED":
      return "Citation gained";
    case "COMPETITOR_OVERTAKE":
      return "Competitor overtake";
    case "SENTIMENT_FLIP":
      return "Sentiment flipped negative";
    default:
      return type;
  }
}

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function AlertsFeedContent() {
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const markedRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    markedRef.current = false;
    try {
      const res = await fetch("/api/alerts");
      if (!res.ok) {
        setError("Could not load alerts.");
        return;
      }
      const data = await res.json();
      setAlerts(data.alerts ?? []);
    } catch {
      setError("Could not load alerts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (loading || markedRef.current) return;
    if (!alerts.some((a) => !a.readAt)) return;
    markedRef.current = true;
    startTransition(async () => {
      await fetch("/api/alerts/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      setAlerts((prev) =>
        prev.map((a) =>
          a.readAt ? a : { ...a, readAt: new Date().toISOString() }
        )
      );
    });
  }, [alerts, loading]);

  return (
    <DashboardPage>
      <PageHeader
        title="Alerts"
        description="Confirmed citation changes only — single-run flips are filtered out. Email digests default to weekly once a mail provider is configured."
        actions={
          <Link
            href="/dashboard/alerts/settings"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-muted"
          >
            <Settings className="h-4 w-4" />
            Alert settings
          </Link>
        }
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading alerts…</p>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {!loading && !error && alerts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No confirmed changes yet. Alerts appear after the same change holds
          across two consecutive citation runs for a tracked query.
        </p>
      ) : null}

      <ul className="space-y-4">
        {alerts.map((alert) => {
          const model =
            typeof alert.detail?.model === "string" ? alert.detail.model : null;
          const competitor =
            typeof alert.detail?.competitorBrandName === "string"
              ? alert.detail.competitorBrandName
              : null;
          return (
            <li
              key={alert.id}
              className="border-b border-border pb-4 last:border-0"
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-foreground">
                  {typeLabel(alert.type)}
                </p>
                {!alert.readAt ? (
                  <StatusPill tone="warn">Unread</StatusPill>
                ) : (
                  <StatusPill tone="ok">Read</StatusPill>
                )}
                {pending ? (
                  <span className="text-xs text-muted-foreground">
                    Marking read…
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {alert.brandName ?? "Brand"}
                {model ? ` · ${model}` : ""}
                {competitor ? ` · vs ${competitor}` : ""}
              </p>
              {alert.promptText ? (
                <p className="mt-1 line-clamp-2 text-sm text-foreground/80">
                  {alert.promptText}
                </p>
              ) : null}
              <p className="mt-2 text-xs text-muted-foreground">
                {formatWhen(alert.createdAt)}
                {alert.deliverySkippedReason?.includes("NO_MAIL_PROVIDER")
                  ? " · Email not sent (no mail provider configured)"
                  : null}
              </p>
            </li>
          );
        })}
      </ul>
    </DashboardPage>
  );
}
