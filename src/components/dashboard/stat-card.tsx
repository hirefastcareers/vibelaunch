"use client";

import { Line, LineChart, ResponsiveContainer } from "recharts";
import { TrendBadge } from "@/components/ui/trend-badge";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  label: string;
  value: string | number;
  trend?: number;
  sparkline?: number[];
  className?: string;
  id?: string;
}

const SPARKLINE_STROKE = "hsl(var(--primary))";

export function StatCard({ label, value, trend, sparkline, className, id }: StatCardProps) {
  const sparkData = sparkline?.map((v, i) => ({ i, v }));
  const showSpark = Boolean(sparkData && sparkData.length > 1);

  return (
    <div
      id={id}
      className={cn(
        "ds-card group",
        className
      )}
    >
      <p className="ds-label">{label}</p>
      <div className="mt-3 flex items-baseline gap-2.5">
        <span className="ds-metric-sm">{value}</span>
        {trend != null && <TrendBadge value={trend} />}
      </div>
      {showSpark && sparkData && (
        <div className="mt-3 h-11 w-full">
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
        </div>
      )}
    </div>
  );
}
