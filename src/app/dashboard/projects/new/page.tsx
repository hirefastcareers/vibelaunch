"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const name = form.get("name") as string;
    const slug =
      (form.get("slug") as string) ||
      name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        slug,
        description: form.get("description") || undefined,
        tagline: form.get("tagline") || undefined,
        websiteUrl: form.get("websiteUrl") || undefined,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error?.toString() ?? "Failed to create project");
      setLoading(false);
      return;
    }

    const { project } = await res.json();
    router.push(`/dashboard/projects/${project.id}`);
  }

  return (
    <main className="min-h-screen max-w-xl mx-auto px-4 py-12">
      <h1 className="text-4xl mb-8">New Project</h1>
      <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 rounded-sm border border-stone-800">
        {error && (
          <div className="p-3 border border-stone-800 font-mono text-[12px] text-muted-foreground">{error}</div>
        )}
        <div>
          <label className="block font-mono text-[11px] tracking-wider text-muted-foreground mb-1">NAME</label>
          <input name="name" required className="w-full border border-stone-800 rounded-sm bg-background px-3 py-2" />
        </div>
        <div>
          <label className="block font-mono text-[11px] tracking-wider text-muted-foreground mb-1">SLUG</label>
          <input
            name="slug"
            placeholder="auto-generated from name"
            pattern="[a-z0-9-]+"
            className="w-full border border-stone-800 rounded-sm bg-background px-3 py-2"
          />
        </div>
        <div>
          <label className="block font-mono text-[11px] tracking-wider text-muted-foreground mb-1">TAGLINE</label>
          <input name="tagline" className="w-full border border-stone-800 rounded-sm bg-background px-3 py-2" />
        </div>
        <div>
          <label className="block font-mono text-[11px] tracking-wider text-muted-foreground mb-1">DESCRIPTION</label>
          <textarea name="description" rows={3} className="w-full border border-stone-800 rounded-sm bg-background px-3 py-2" />
        </div>
        <div>
          <label className="block font-mono text-[11px] tracking-wider text-muted-foreground mb-1">WEBSITE URL</label>
          <input name="websiteUrl" type="url" className="w-full border border-stone-800 rounded-sm bg-background px-3 py-2" />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-primary text-primary-foreground rounded-sm hover:bg-primary/90 disabled:opacity-50 font-mono text-xs tracking-wider"
        >
          {loading ? "CREATING..." : "CREATE PROJECT"}
        </button>
      </form>
    </main>
  );
}
