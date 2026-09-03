"use client";

import { useState } from "react";

export function RoiCalculator() {
  const [posts, setPosts] = useState(4);
  const [hours, setHours] = useState(10);

  const automatedPosts = posts * 5;
  const hoursSaved = Math.round(hours * 0.85);
  const projectedCitations = Math.round(posts * 2.4);
  const articlesGenerated = Math.round(posts * 1.2);

  return (
    <div className="ds-card overflow-hidden">
      <div className="mb-6">
        <span className="ds-kicker">ROI Calculator</span>
        <h3 className="mt-2 text-2xl">See what Sorano does with your updates</h3>
      </div>

      <div className="space-y-6">
        <div>
          <label className="mb-2 flex items-center justify-between">
            <span className="text-sm text-foreground">Weekly product updates</span>
            <span className="text-sm font-medium text-primary">{posts}</span>
          </label>
          <input
            type="range"
            min={1}
            max={15}
            value={posts}
            onChange={(e) => setPosts(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>

        <div>
          <label className="mb-2 flex items-center justify-between">
            <span className="text-sm text-foreground">Hours on content/week</span>
            <span className="text-sm font-medium text-primary">{hours}h</span>
          </label>
          <input
            type="range"
            min={1}
            max={40}
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-muted/30 p-4">
          <ResultCard label="Posts generated" value={`${automatedPosts}/wk`} />
          <ResultCard label="Hours saved" value={`${hoursSaved}h/wk`} />
          <ResultCard label="AI citations" value={`~${projectedCitations}`} />
          <ResultCard label="SEO articles" value={`${articlesGenerated}/wk`} />
        </div>

        <p className="text-center text-[11px] text-muted-foreground">
          Based on average Sorano user data across all tiers
        </p>
      </div>
    </div>
  );
}

function ResultCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-[28px] font-medium leading-none tracking-tight text-primary">{value}</div>
      <div className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
