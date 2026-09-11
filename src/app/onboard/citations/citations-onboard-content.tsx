"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DashboardPage, PageHeader } from "@/components/dashboard-page";
import { formatFirstResultsMessage } from "@/lib/geo/next-citation-sweep";

type Step = "brand" | "review";

export default function CitationsOnboardPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("brand");
  const [brandName, setBrandName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [descriptors, setDescriptors] = useState(["", ""]);
  const [prompts, setPrompts] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const firstResultsHint = useMemo(() => formatFirstResultsMessage(), []);

  function updateDescriptor(index: number, value: string) {
    setDescriptors((prev) => prev.map((d, i) => (i === index ? value : d)));
  }

  function addDescriptor() {
    if (descriptors.length >= 4) return;
    setDescriptors((prev) => [...prev, ""]);
  }

  function removeDescriptor(index: number) {
    if (descriptors.length <= 2) return;
    setDescriptors((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setGenerating(true);
    try {
      const cleaned = descriptors.map((d) => d.trim()).filter(Boolean);
      const res = await fetch("/api/geo/generate-prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName: brandName.trim(),
          websiteUrl: websiteUrl.trim(),
          descriptors: cleaned,
        }),
      });
      const json = (await res.json()) as {
        prompts?: string[];
        error?: string;
      };
      if (!res.ok) {
        setError(json.error ?? "Could not generate prompts");
        return;
      }
      if (!json.prompts?.length) {
        setError("No prompts returned. Try again or adjust descriptors.");
        return;
      }
      setPrompts(json.prompts);
      setStep("review");
    } catch {
      setError("Network error while generating prompts");
    } finally {
      setGenerating(false);
    }
  }

  async function handleConfirm() {
    const cleaned = prompts.map((p) => p.trim()).filter((p) => p.length >= 3);
    if (cleaned.length === 0) {
      setError("Keep at least one prompt before saving");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      // Honest schedule messaging: do not runNow on confirm.
      const res = await fetch("/api/geo/tracked-queries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName: brandName.trim(),
          prompts: cleaned,
          runNow: false,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to save tracked queries");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error while saving prompts");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardPage>
      <PageHeader
        title="Set up citation tracking"
        description="Tell us about your brand. We’ll draft buyer-intent prompts for you to review before anything is tracked."
      />

      {step === "brand" ? (
        <Card>
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-base font-medium">Brand details</CardTitle>
            <CardDescription>
              2–4 short descriptors work best (category, audience, use case).
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            <form onSubmit={(e) => void handleGenerate(e)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="brand-name">Brand name</Label>
                <Input
                  id="brand-name"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Acme"
                  required
                  maxLength={120}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand-url">Website URL</Label>
                <Input
                  id="brand-url"
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://acme.example"
                  required
                />
              </div>
              <div className="space-y-3">
                <Label>What you do (2–4 short phrases)</Label>
                {descriptors.map((value, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={value}
                      onChange={(e) => updateDescriptor(index, e.target.value)}
                      placeholder={
                        index === 0
                          ? "CRM for indie founders"
                          : index === 1
                            ? "email sequences"
                            : "another descriptor"
                      }
                      required
                      maxLength={80}
                    />
                    {descriptors.length > 2 ? (
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        onClick={() => removeDescriptor(index)}
                        aria-label="Remove descriptor"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>
                ))}
                {descriptors.length < 4 ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={addDescriptor}
                  >
                    <Plus className="mr-1.5 h-4 w-4" />
                    Add descriptor
                  </Button>
                ) : null}
              </div>

              {error ? (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              ) : null}

              <Button type="submit" disabled={generating}>
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating prompts…
                  </>
                ) : (
                  "Generate starter prompts"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-base font-medium">
              Review tracked prompts
            </CardTitle>
            <CardDescription>
              Edit or delete anything that doesn’t fit. Nothing is saved until
              you confirm. {firstResultsHint}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            <ul className="space-y-3">
              {prompts.map((prompt, index) => (
                <li key={index} className="flex gap-2">
                  <Input
                    value={prompt}
                    onChange={(e) =>
                      setPrompts((prev) =>
                        prev.map((p, i) => (i === index ? e.target.value : p))
                      )
                    }
                    maxLength={1000}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    onClick={() =>
                      setPrompts((prev) => prev.filter((_, i) => i !== index))
                    }
                    aria-label="Delete prompt"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                setPrompts((prev) =>
                  prev.length >= 12 ? prev : [...prev, ""]
                )
              }
              disabled={prompts.length >= 12}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add prompt
            </Button>

            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setStep("brand");
                  setError(null);
                }}
                disabled={saving}
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={() => void handleConfirm()}
                disabled={saving || prompts.every((p) => !p.trim())}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Confirm & start tracking"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </DashboardPage>
  );
}
