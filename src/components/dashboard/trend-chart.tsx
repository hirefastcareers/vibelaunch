"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { LegendPayload, TooltipContentProps } from "recharts";
import { cn } from "@/lib/utils";

export interface TrendChartSeries {
  key: string;
  label: string;
  featured?: boolean;
}

export interface TrendChartProps {
  data: Array<Record<string, number | string>>;
  series: TrendChartSeries[];
  xKey: string;
  className?: string;
}

const TOKEN = {
  primary: "hsl(var(--primary))",
  ink: "hsl(var(--ink))",
  inkMuted: "hsl(var(--ink-muted))",
  surfaceMuted: "hsl(var(--surface-muted))",
  border: "hsl(var(--border))",
  mutedFg: "hsl(var(--muted-foreground))",
} as const;

const COMPARISON_TONES = [TOKEN.ink, TOKEN.inkMuted, TOKEN.surfaceMuted] as const;
const COMPARISON_DASHES = [undefined, "6 4", "2 3"] as const;

const AXIS_TICK = {
  fill: TOKEN.mutedFg,
  fontSize: 11,
  fontFamily: "var(--font-mono), ui-monospace, monospace",
} as const;

interface SeriesStyle {
  stroke: string;
  dash?: string;
  width: number;
}

function seriesStyles(series: TrendChartSeries[]): Record<string, SeriesStyle> {
  const comparisonCount = series.filter((s) => !s.featured).length;
  const styles: Record<string, SeriesStyle> = {};
  let comparisonIndex = 0;

  for (const item of series) {
    if (item.featured) {
      styles[item.key] = { stroke: TOKEN.primary, width: 2 };
      continue;
    }

    const stroke = COMPARISON_TONES[comparisonIndex % COMPARISON_TONES.length];
    const dash =
      comparisonCount > 2 ? COMPARISON_DASHES[comparisonIndex % COMPARISON_DASHES.length] : undefined;
    styles[item.key] = { stroke, dash, width: 1.5 };
    comparisonIndex += 1;
  }

  return styles;
}

function payloadKey(item: { dataKey?: unknown }): string | undefined {
  const key = item.dataKey;
  return typeof key === "string" || typeof key === "number" ? String(key) : undefined;
}

function TrendTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-sm border border-border bg-card px-2.5 py-2 text-card-foreground shadow-none">
      <p className="mb-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <ul className="space-y-1">
        {payload.map((entry) => {
          const key = payloadKey(entry) ?? String(entry.name ?? "");
          return (
            <li key={key} className="flex items-baseline justify-between gap-6 font-mono text-[11px]">
              <span className="text-muted-foreground">{entry.name}</span>
              <span className="text-foreground tabular-nums">{entry.value}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function TrendChart({ data, series, xKey, className }: TrendChartProps) {
  const styles = useMemo(() => seriesStyles(series), [series]);
  const [hidden, setHidden] = useState<ReadonlySet<string>>(() => new Set());

  function toggle(key: string) {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function renderLegend({ payload }: { payload?: ReadonlyArray<LegendPayload> }) {
    if (!payload?.length) return null;

    return (
      <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 pt-3">
        {payload.map((entry, index) => {
          const key = payloadKey(entry);
          const isHidden = key ? hidden.has(key) : Boolean(entry.inactive);
          const style = key ? styles[key] : undefined;
          const color = style?.stroke ?? entry.color ?? TOKEN.mutedFg;

          return (
            <li key={key ?? `legend-${index}`}>
              <button
                type="button"
                onClick={() => key && toggle(key)}
                className={cn(
                  "inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider",
                  isHidden ? "text-muted-foreground" : "text-foreground"
                )}
              >
                <svg width="14" height="8" viewBox="0 0 14 8" aria-hidden className="shrink-0">
                  <line
                    x1="0"
                    y1="4"
                    x2="14"
                    y2="4"
                    stroke={color}
                    strokeWidth="2"
                    strokeDasharray={style?.dash}
                    opacity={isHidden ? 0.4 : 1}
                  />
                </svg>
                <span className={isHidden ? "line-through decoration-muted-foreground" : undefined}>
                  {entry.value}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className={cn("h-[280px] w-full", className)}>
      <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 640, height: 280 }}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={TOKEN.border} vertical={false} />
          <XAxis
            dataKey={xKey}
            tick={AXIS_TICK}
            axisLine={{ stroke: TOKEN.border }}
            tickLine={false}
          />
          <YAxis
            width="auto"
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={TrendTooltip}
            cursor={{ stroke: TOKEN.border, strokeWidth: 1 }}
            isAnimationActive={false}
            wrapperStyle={{ outline: "none", zIndex: 10 }}
            itemSorter={(item) => {
              const idx = series.findIndex((s) => s.key === payloadKey(item));
              return idx === -1 ? series.length : idx;
            }}
          />
          <Legend content={renderLegend} itemSorter={null} />
          {series.map((item) => {
            const style = styles[item.key];
            return (
              <Line
                key={item.key}
                type="monotone"
                dataKey={item.key}
                name={item.label}
                stroke={style.stroke}
                strokeWidth={style.width}
                strokeDasharray={style.dash}
                hide={hidden.has(item.key)}
                dot={false}
                activeDot={{ r: 3, strokeWidth: 0, fill: style.stroke }}
                isAnimationActive="auto"
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
