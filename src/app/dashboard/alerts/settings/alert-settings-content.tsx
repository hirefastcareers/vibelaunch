"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { DashboardPage, PageHeader } from "@/components/dashboard-page";
import { StatusPill } from "@/components/status-pill";
import { BILLING_UPGRADE_PATH } from "@/lib/billing/plans";

type Preference = {
  citationLostEnabled: boolean;
  citationGainedEnabled: boolean;
  competitorOvertakeEnabled: boolean;
  sentimentFlipEnabled: boolean;
  digestFrequency: "OFF" | "WEEKLY" | "IMMEDIATE";
  webhookUrl: string | null;
  webhookFailCount: number;
  webhookLastError: string | null;
  webhookLastSuccessAt: string | null;
  webhookDisabledAt: string | null;
};

type PlanInfo = {
  tier: string;
  alertWebhooks: boolean;
  upgradePath: string;
};

export function AlertSettingsContent() {
  const [pref, setPref] = useState<Preference | null>(null);
  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [mailConfigured, setMailConfigured] = useState(false);
  const [webhookDraft, setWebhookDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pending, startTransition] = useTransition();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/alerts");
      if (!res.ok) {
        setError("Could not load alert settings.");
        return;
      }
      const data = await res.json();
      setPref(data.preference);
      setPlan(data.plan);
      setMailConfigured(Boolean(data.mailProviderConfigured));
      setWebhookDraft(data.preference?.webhookUrl ?? "");
    } catch {
      setError("Could not load alert settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function patch(body: Record<string, unknown>) {
    startTransition(async () => {
      setError(null);
      setSaved(false);
      const res = await fetch("/api/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          typeof data.error === "string" ? data.error : "Could not save settings."
        );
        return;
      }
      setPref(data.preference);
      setWebhookDraft(data.preference?.webhookUrl ?? "");
      setSaved(true);
    });
  }

  if (loading) {
    return (
      <DashboardPage>
        <PageHeader title="Alert settings" />
        <p className="text-sm text-muted-foreground">Loading…</p>
      </DashboardPage>
    );
  }

  if (!pref) {
    return (
      <DashboardPage>
        <PageHeader title="Alert settings" />
        <p className="text-sm text-destructive">
          {error ?? "Settings unavailable."}
        </p>
      </DashboardPage>
    );
  }

  const toggles: Array<{
    key: keyof Pick<
      Preference,
      | "citationLostEnabled"
      | "citationGainedEnabled"
      | "competitorOvertakeEnabled"
      | "sentimentFlipEnabled"
    >;
    label: string;
    help: string;
  }> = [
    {
      key: "citationLostEnabled",
      label: "Citation lost",
      help: "Brand was mentioned, then wasn’t — confirmed on two runs.",
    },
    {
      key: "citationGainedEnabled",
      label: "Citation gained",
      help: "Brand newly appears in answers — confirmed on two runs.",
    },
    {
      key: "competitorOvertakeEnabled",
      label: "Competitor overtake",
      help: "A tracked competitor is mentioned while you are not.",
    },
    {
      key: "sentimentFlipEnabled",
      label: "Sentiment flip",
      help: "A previously positive mention flips to negative.",
    },
  ];

  return (
    <DashboardPage>
      <PageHeader
        title="Alert settings"
        description="Defaults favour a weekly digest. Changes only alert after two confirming citation runs."
        actions={
          <Link
            href="/dashboard/alerts"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm hover:bg-muted"
          >
            Back to alerts
          </Link>
        }
      />

      {!mailConfigured ? (
        <p className="text-sm text-muted-foreground">
          Email delivery is not wired yet (no mail provider in this repo). In-app
          alerts still work; choose digest frequency now so email can start once
          a provider is configured.
        </p>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-sm font-medium text-foreground">Alert types</h2>
        <ul className="space-y-3">
          {toggles.map((t) => (
            <li key={t.key} className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-foreground">{t.label}</p>
                <p className="text-xs text-muted-foreground">{t.help}</p>
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={() => patch({ [t.key]: !pref[t.key] })}
                className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted disabled:opacity-50"
                aria-pressed={pref[t.key]}
              >
                {pref[t.key] ? "On" : "Off"}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-foreground">Digest frequency</h2>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["WEEKLY", "Weekly digest"],
              ["IMMEDIATE", "Immediate"],
              ["OFF", "Off"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              disabled={pending}
              onClick={() => patch({ digestFrequency: value })}
              className={`rounded-lg border px-3 py-1.5 text-xs ${
                pref.digestFrequency === value
                  ? "border-foreground bg-foreground text-background"
                  : "border-border hover:bg-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Default is weekly. Immediate still requires a configured mail provider.
        </p>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-medium text-foreground">Webhook</h2>
          {plan?.alertWebhooks ? (
            <StatusPill tone="ok">Starter / Pro</StatusPill>
          ) : (
            <StatusPill tone="warn">Paid plans</StatusPill>
          )}
        </div>
        {!plan?.alertWebhooks ? (
          <p className="text-sm text-muted-foreground">
            Outbound webhooks are available on Starter and Pro.{" "}
            <Link href={plan?.upgradePath ?? BILLING_UPGRADE_PATH} className="underline">
              Upgrade
            </Link>
          </p>
        ) : (
          <>
            <label className="block text-xs text-muted-foreground" htmlFor="webhook-url">
              HTTPS endpoint (POST JSON on each confirmed alert)
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="webhook-url"
                type="url"
                value={webhookDraft}
                onChange={(e) => setWebhookDraft(e.target.value)}
                placeholder="https://example.com/hooks/xoopa"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  patch({
                    webhookUrl: webhookDraft.trim() === "" ? null : webhookDraft,
                  })
                }
                className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
              >
                Save
              </button>
            </div>
            {pref.webhookDisabledAt ? (
              <div className="space-y-2 text-sm">
                <StatusPill tone="warn">Endpoint disabled after repeated failures</StatusPill>
                <p className="text-muted-foreground">
                  Last error: {pref.webhookLastError ?? "unknown"}
                </p>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => patch({ clearWebhookCircuit: true })}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted"
                >
                  Re-enable webhook
                </button>
              </div>
            ) : pref.webhookLastError ? (
              <p className="text-xs text-muted-foreground">
                Last delivery error: {pref.webhookLastError} (failures:{" "}
                {pref.webhookFailCount})
              </p>
            ) : pref.webhookLastSuccessAt ? (
              <p className="text-xs text-muted-foreground">
                Last success: {new Date(pref.webhookLastSuccessAt).toLocaleString()}
              </p>
            ) : null}
          </>
        )}
      </section>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {saved ? (
        <p className="text-sm text-muted-foreground">Settings saved.</p>
      ) : null}
    </DashboardPage>
  );
}
