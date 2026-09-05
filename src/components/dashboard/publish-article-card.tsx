"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface PublishArticleCardProps {
  projects: Array<{ id: string; name: string }>;
}

export function PublishArticleCard({ projects }: PublishArticleCardProps) {
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [url, setUrl] = useState("");

  async function handlePublish() {
    if (!projectId || !title || !summary) return;
    setLoading(true);
    setError("");
    setUrl("");
    try {
      const res = await fetch("/api/seo/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, title, summary }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not publish article");
        return;
      }
      setUrl(typeof data.url === "string" ? data.url : "");
      setTitle("");
      setSummary("");
    } catch {
      setError("Network error - please try again");
    } finally {
      setLoading(false);
    }
  }

  if (!projects.length) {
    return null;
  }

  return (
    <Card id="articles" className="overflow-hidden rounded-xl shadow-sm">
      <CardHeader className="border-b border-border bg-muted/30">
        <p className="font-mono text-[10px] tracking-widest text-muted-foreground">
          SEO
        </p>
        <CardTitle className="mt-1 text-xl">Publish a changelog article</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        <p className="text-sm text-muted-foreground">
          Expands into a public /changelog page, sitemap entry, and a Google indexing request when
          the service account is configured.
        </p>
        <div className="space-y-2">
          <Label>Project</Label>
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger>
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="article-title">Title</Label>
          <Input
            id="article-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="X OAuth is live on Sorano"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="article-summary">What shipped</Label>
          <Textarea
            id="article-summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Two to four sentences about the update."
            rows={4}
          />
        </div>
        {error ? (
          <p className="font-mono text-[12px] text-muted-foreground">{error}</p>
        ) : null}
        {url ? (
          <p className="text-sm">
            Live at{" "}
            <a href={url} className="text-primary hover:underline" target="_blank" rel="noreferrer">
              {url}
            </a>
          </p>
        ) : null}
        <Button
          onClick={handlePublish}
          disabled={loading || !title || !summary || !projectId}
          className="font-mono text-xs tracking-wider"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              PUBLISHING...
            </>
          ) : (
            "PUBLISH ARTICLE"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
