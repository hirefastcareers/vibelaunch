"use client";

import { useEffect, useRef, useState } from "react";

interface TickerStat {
  label: string;
  value: number;
  suffix: string;
}

const STATS: TickerStat[] = [
  { label: "Posts generated", value: 12847, suffix: "" },
  { label: "Articles indexed", value: 3421, suffix: "" },
  { label: "AI citations tracked", value: 48920, suffix: "" },
  { label: "Prompts swept", value: 156000, suffix: "+" },
];

function AnimatedNumber({ target, suffix }: { target: number; suffix: string }) {
  const [current, setCurrent] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setStarted(true);
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const duration = 1500;
    const steps = 40;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(eased * target));
      if (step >= steps) {
        setCurrent(target);
        clearInterval(timer);
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [started, target]);

  return (
    <span ref={ref} className="tabular-nums">
      {current.toLocaleString()}
      {suffix}
    </span>
  );
}

export function StatsTicker() {
  return (
    <div className="border-y border-border bg-muted/30">
      <div className="ds-container py-4">
        <p className="mb-4 text-center text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Illustrative platform volume
        </p>
        <div className="grid grid-cols-2 gap-px bg-border md:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="bg-background px-6 py-8 text-center md:py-10">
              <div className="ds-metric text-foreground">
                <AnimatedNumber target={stat.value} suffix={stat.suffix} />
              </div>
              <div className="mt-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
