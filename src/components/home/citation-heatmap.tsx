"use client";

import { cn } from "@/lib/utils";

export interface HeatmapWeek {
  week: string;
  citations: number;
}

const INTENSITY = [
  "bg-muted",
  "bg-primary/15",
  "bg-primary/30",
  "bg-primary/50",
  "bg-primary/75",
  "bg-primary",
] as const;

function cellIntensity(value: number, max: number): (typeof INTENSITY)[number] {
  if (value === 0) return INTENSITY[0];
  const ratio = value / max;
  if (ratio < 0.2) return INTENSITY[1];
  if (ratio < 0.4) return INTENSITY[2];
  if (ratio < 0.6) return INTENSITY[3];
  if (ratio < 0.8) return INTENSITY[4];
  return INTENSITY[5];
}

export function CitationHeatmap({ data }: { data: HeatmapWeek[] }) {
  const max = Math.max(...data.map((d) => d.citations), 1);

  return (
    <div className="ds-card-flat">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg">Citation Frequency</h3>
        <span className="ds-label">Last {data.length} weeks</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {data.map((week) => (
          <div
            key={week.week}
            className={cn(
              "h-8 w-8 rounded-[4px] transition-colors sm:h-9 sm:w-9",
              cellIntensity(week.citations, max)
            )}
            title={`${week.week}: ${week.citations} citations`}
          />
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2 text-[11px] text-muted-foreground">
        <span>Less</span>
        {INTENSITY.map((cls, i) => (
          <div key={i} className={cn("h-3.5 w-3.5 rounded-[3px]", cls)} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
