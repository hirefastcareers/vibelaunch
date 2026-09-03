"use client";

import { cn } from "@/lib/utils";

export interface RankingRow {
  prompt: string;
  chatgpt: number | null;
  perplexity: number | null;
  claude: number | null;
  trend: "up" | "down" | "stable" | "new";
  lastChecked: string;
}

const TREND_DISPLAY = {
  up: { icon: "▲", className: "text-green-600" },
  down: { icon: "▼", className: "text-red-500" },
  stable: { icon: "—", className: "text-muted-foreground" },
  new: { icon: "★", className: "text-primary" },
} as const;

function PositionCell({ pos }: { pos: number | null }) {
  if (pos === null) return <span className="text-muted-foreground">—</span>;
  return (
    <span
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-md font-mono text-xs font-medium",
        pos <= 2 && "bg-primary/10 text-primary",
        pos === 3 && "bg-blue-50 text-blue-600",
        pos > 3 && "bg-muted text-muted-foreground"
      )}
    >
      {pos}
    </span>
  );
}

export function RankingTable({ rows }: { rows: RankingRow[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="ds-table">
        <thead>
          <tr>
            <th className="min-w-[240px]">Tracked Prompt</th>
            <th className="w-[100px] text-center">ChatGPT</th>
            <th className="w-[100px] text-center">Perplexity</th>
            <th className="w-[100px] text-center">Claude</th>
            <th className="w-[80px] text-center">Trend</th>
            <th className="w-[120px] text-right">Last Checked</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const trend = TREND_DISPLAY[row.trend];
            return (
              <tr key={row.prompt}>
                <td className="font-medium">{row.prompt}</td>
                <td className="text-center">
                  <PositionCell pos={row.chatgpt} />
                </td>
                <td className="text-center">
                  <PositionCell pos={row.perplexity} />
                </td>
                <td className="text-center">
                  <PositionCell pos={row.claude} />
                </td>
                <td className="text-center">
                  <span className={cn("font-mono text-xs", trend.className)}>
                    {trend.icon}
                  </span>
                </td>
                <td className="text-right font-mono text-[11px] text-muted-foreground">
                  {row.lastChecked}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
