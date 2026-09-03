"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { LimitHitNotice } from "@/components/limit-hit-notice";

const TONES = [
  { value: "build-in-public", label: "Build in Public" },
  { value: "unfiltered", label: "Unfiltered" },
  { value: "technical", label: "Technical" },
  { value: "minimalist", label: "Minimalist" },
] as const;

export default function OnboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorCode, setErrorCode] = useState<string | undefined>();
  const [keywords, setKeywords] = useState("");
  const [tone, setTone] = useState("build-in-public");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setErrorCode(undefined);

    const form = new FormData(e.currentTarget);
    const keywordList = keywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    try {
      const res = await fetch("/api/project/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUrl: form.get("targetUrl"),
          projectName: form.get("projectName"),
          tone,
          keywords: keywordList,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorCode(typeof data.code === "string" ? data.code : undefined);
        setError(typeof data.error === "string" ? data.error : "Onboarding failed");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Network error - please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6">
      <div className="mb-8">
        <p className="font-mono mb-1 text-[10px] tracking-widest text-muted-foreground">
          ONBOARD
        </p>
        <h1 className="mb-2 text-[38px] md:text-[48px]">Onboard your product</h1>
        <p className="max-w-[56ch] text-sm leading-relaxed text-muted-foreground">
          Give Sorano a real product URL and a writing tone. It will pull context, create the project record,
          and prepare the rest of the growth loop.
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border pb-4">
            <p className="font-mono text-[10px] tracking-widest text-muted-foreground">
              BEFORE YOU START
            </p>
            <CardTitle className="mt-1 text-[24px]">Bring the minimum context</CardTitle>
            <CardDescription>
              Better input gives better hooks, better changelog structure, and cleaner citation prompts.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-0 p-0">
            <div className="border-b border-border bg-background px-5 py-5">
              <p className="font-mono text-[10px] tracking-widest text-muted-foreground">01 · URL</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Use your main product page or the clearest feature page, not a generic company shell.
              </p>
            </div>
            <div className="border-b border-border bg-card px-5 py-5">
              <p className="font-mono text-[10px] tracking-widest text-muted-foreground">02 · TONE</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Pick the voice that already matches your posts. This steers the first batch of drafts.
              </p>
            </div>
            <div className="bg-background px-5 py-5">
              <p className="font-mono text-[10px] tracking-widest text-muted-foreground">03 · KEYWORDS</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Seed 3 to 8 phrases you actually want to rank and be cited for. Sorano will merge them with scraped context.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border bg-muted/30">
            <CardTitle>Project Setup</CardTitle>
            <CardDescription>
              Paste your product URL. We&apos;ll pull in your name, description, and keywords to get started.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-xl border border-border bg-background p-3 font-mono text-[12px] text-muted-foreground">
                  <LimitHitNotice code={errorCode} fallback={error} />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="targetUrl">Target URL</Label>
                <Input
                  id="targetUrl"
                  name="targetUrl"
                  type="url"
                  required
                  defaultValue=""
                  placeholder="https://yourproduct.com"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name</Label>
                <Input
                  id="projectName"
                  name="projectName"
                  required
                  defaultValue=""
                  placeholder="Your product name"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tone">Tone</Label>
                <Select value={tone} onValueChange={setTone} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tone" />
                  </SelectTrigger>
                  <SelectContent>
                    {TONES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="keywords">Initial Keywords</Label>
                <Input
                  id="keywords"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="saas, launch, ai (comma-separated)"
                  disabled={loading}
                />
              </div>

              <Button type="submit" className="h-11 w-full rounded-xl" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Setting up your workspace...
                  </>
                ) : (
                  "Launch Onboarding"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
