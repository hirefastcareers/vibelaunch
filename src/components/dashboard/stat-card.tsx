"use client";

import { Line, LineChart, ResponsiveContainer } from "recharts";
import { ChartFrame } from "@/components/chart-frame";
import { TrendBadge } from "@/components/ui/trend-badge";
import { CHART_COLOR } from "@/lib/chart-colors";
import { useMounted } from "@/lib/use-mounted";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  trend?: number;
  sparkline?: number[];
  className?: string;
  id?: string;
}

const SPARKLINE_STROKE = CHART_COLOR.primary;

export function StatCard({ label, value, hint, trend, sparkline, className, id }: StatCardProps) {
  const mounted = useMounted();
  const sparkData = sparkline?.map((v, i) => ({ i, v }));
  const showSpark = Boolean(sparkData && sparkData.length > 1);

  return (
    <div
      id={id}
      className={cn(
        "rounded-xl border border-border bg-background p-5 shadow-sm",
        className
      )}
    >
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-[1.75rem] font-medium leading-none tracking-tight tabular-nums">
          {value}
        </span>
        {trend != null && <TrendBadge value={trend} />}
      </div>
      {hint ? <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p> : null}
      {showSpark && sparkData && (
        <div className="mt-3 h-11 w-full">
          {mounted ? (
            <ChartFrame fallback={null}>
              <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 240, height: 44 }}>
                <LineChart data={sparkData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                  <Line
                    type="monotone"
                    dataKey="v"
                    stroke={SPARKLINE_STROKE}
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartFrame>
          ) : null}
        </div>
      )}
    </div>
  );
}
