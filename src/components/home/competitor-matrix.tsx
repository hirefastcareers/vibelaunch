"use client";

import { cn } from "@/lib/utils";

export interface CompetitorRow {
  name: string;
  shareOfVoice: number;
  citationRate: number;
  avgPosition: number;
  trend: "up" | "down" | "stable";
  highlighted?: boolean;
}

function BarFill({ pct, highlighted }: { pct: number; highlighted?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            highlighted ? "bg-primary" : "bg-foreground/25"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="min-w-[36px] text-right text-xs font-medium tabular-nums">{pct}%</span>
    </div>
  );
}

export function CompetitorMatrix({ rows }: { rows: CompetitorRow[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="ds-table">
        <thead>
          <tr>
            <th className="min-w-[160px]">Product</th>
            <th className="min-w-[180px]">Share of Voice</th>
            <th className="w-[120px] text-center">Citation Rate</th>
            <th className="w-[120px] text-center">Avg Position</th>
            <th className="w-[80px] text-center">Trend</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} className={cn(row.highlighted && "bg-primary/[0.03]")}>
              <td>
                <span className={cn("font-medium", row.highlighted && "text-primary")}>
                  {row.name}
                </span>
              </td>
              <td>
                <BarFill pct={row.shareOfVoice} highlighted={row.highlighted} />
              </td>
              <td className="text-center text-sm font-medium tabular-nums">{row.citationRate}%</td>
              <td className="text-center">
                <span
                  className={cn(
                    "inline-flex h-7 min-w-[28px] items-center justify-center rounded-md text-xs font-medium",
                    row.avgPosition <= 2 ? "bg-primary/10 text-primary" : "bg-muted text-foreground"
                  )}
                >
                  #{row.avgPosition}
                </span>
              </td>
              <td className="text-center">
                <span
                  className={cn(
                    "text-xs font-medium",
                    row.trend === "up" && "text-green-600",
                    row.trend === "down" && "text-red-500",
                    row.trend === "stable" && "text-muted-foreground"
                  )}
                >
                  {row.trend === "up" ? "▲" : row.trend === "down" ? "▼" : "-"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
