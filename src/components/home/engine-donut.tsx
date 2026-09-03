"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { TooltipContentProps } from "recharts";

export interface EngineSlice {
  name: string;
  value: number;
  color: string;
}

function DonutTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-md">
      <p className="font-mono text-[11px] text-muted-foreground">{entry.name}</p>
      <p className="font-serif text-lg">{entry.value}%</p>
    </div>
  );
}

export function EngineDonut({
  data,
  centerLabel,
  centerValue,
}: {
  data: EngineSlice[];
  centerLabel: string;
  centerValue: string;
}) {
  return (
    <div className="ds-card-flat flex flex-col items-center">
      <div className="relative h-[200px] w-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={DonutTooltip} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-serif text-[28px] leading-none tracking-tight">{centerValue}</span>
          <span className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {centerLabel}
          </span>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-4">
        {data.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="font-mono text-[11px] text-muted-foreground">
              {entry.name} ({entry.value}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
