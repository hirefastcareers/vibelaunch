"use client";

import { useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

function SpineFill({
  sectionRef,
}: {
  sectionRef: RefObject<HTMLElement | null>;
}) {
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <motion.div
      aria-hidden
      className="h-full w-full origin-top bg-primary"
      style={{ scaleY }}
    />
  );
}

export function SectionIndex({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement | null>(null);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const section = hostRef.current?.closest("section") ?? null;
    sectionRef.current = section;
    setReady(Boolean(section));
  }, []);

  return (
    <div ref={hostRef} className="relative min-h-0 self-stretch">
      <div
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 h-full w-0.5 overflow-hidden"
      >
        {ready ? <SpineFill sectionRef={sectionRef} /> : null}
      </div>
      <div className={cn("pl-3.5", className)}>{children}</div>
    </div>
  );
}
