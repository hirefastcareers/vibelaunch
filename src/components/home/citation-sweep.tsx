"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

export type Citation = {
  engine: string;
  state: string;
  cited: boolean;
};

const SNAP = { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] as const };
const STAGGER_S = 0.6;
const STAGGER_MS = STAGGER_S * 1000;
const SWAP_MS = 200;
const HOLD_MS = 6000;

const listVariants = {
  hidden: {
    transition: { staggerChildren: 0, duration: 0.15, ease: SNAP.ease },
  },
  visible: {
    transition: { staggerChildren: STAGGER_S },
  },
};

const askingVariants = {
  hidden: { opacity: 1, y: 0 },
  visible: { opacity: 0, y: -4, transition: SNAP },
};

const resultVariants = {
  hidden: { opacity: 0, y: 4 },
  visible: { opacity: 1, y: 0, transition: SNAP },
};

export function CitationSweep({
  citations,
}: {
  citations: Citation[];
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { once: false, amount: 0.5 });
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!inView) {
      setShow(false);
      return;
    }

    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const play = () => {
      setShow(true);
      const resolveAt = (citations.length - 1) * STAGGER_MS + SWAP_MS;
      timers.push(
        setTimeout(() => {
          if (cancelled) return;
          setShow(false);
          timers.push(
            setTimeout(() => {
              if (!cancelled) play();
            }, SWAP_MS + 80)
          );
        }, resolveAt + HOLD_MS)
      );
    };

    play();

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [inView, citations.length]);

  return (
    <div
      ref={rootRef}
      className="flex flex-col rounded-3xl border border-[#E6E3DE] bg-[#FAFAF8] p-8 shadow-sm"
    >
      <div className="mb-5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        <span>Citation check · Weekly sweep</span>
      </div>
      <motion.div
        variants={listVariants}
        initial="hidden"
        animate={show ? "visible" : "hidden"}
      >
        {citations.map((cite) => (
          <motion.div
            key={cite.engine}
            variants={{ hidden: {}, visible: {} }}
            className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-[#E6E3DE] py-4 text-sm"
          >
            <span className="font-medium text-foreground">{cite.engine}</span>
            <span className="relative min-w-[8.5rem] text-right">
              <motion.span
                variants={askingVariants}
                className="absolute inset-0 text-[12px] tracking-[0.04em] text-muted-foreground"
              >
                Asking...
              </motion.span>
              <motion.span
                variants={resultVariants}
                className={
                  cite.cited
                    ? "inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-[12px] font-medium tracking-[0.04em] text-primary"
                    : "text-[12px] tracking-[0.04em] text-muted-foreground"
                }
              >
                {cite.state}
              </motion.span>
            </span>
          </motion.div>
        ))}
      </motion.div>
      <p className="mb-0 mt-5 text-[13px] leading-[1.6] text-muted-foreground">
        A missing citation opens a task with the specific page and fact to add.
      </p>
    </div>
  );
}
