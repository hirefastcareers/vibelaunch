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
  const [keywords, setKeywords] = useState("");
  const [tone, setTone] = useState("build-in-public");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

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
    <div className="mx-auto max-w-2xl p-8">
      <div className="mb-8">
        <p className="font-mono text-[10px] tracking-widest text-muted-foreground mb-1">
          [ONBOARD]
        </p>
        <h1 className="text-4xl mb-2">Autonomous Growth for Indie Builders</h1>
        <p className="text-muted-foreground">
          Turn your product updates into viral social posts, Google-ranked articles, and AI search recommendations - automatically.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Setup</CardTitle>
          <CardDescription>
            Paste your product URL. We&apos;ll pull in your name, description, and keywords to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-sm border border-stone-800 p-3 font-mono text-[12px] text-muted-foreground">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="targetUrl">Target URL</Label>
              <Input
                id="targetUrl"
                name="targetUrl"
                type="url"
                required
                defaultValue="https://sorano.app"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectName">Project Name</Label>
              <Input
                id="projectName"
                name="projectName"
                required
                defaultValue="Sorano"
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

            <Button type="submit" className="w-full" disabled={loading}>
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
  );
}
