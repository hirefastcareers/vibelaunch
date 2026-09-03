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
    <div ref={rootRef} className="flex flex-col bg-ink-panel p-[30px]">
      <div className="mb-5 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[10px] tracking-[0.14em] text-[#8C857A]">
        <span>CITATION CHECK · WEEKLY SWEEP</span>
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
            className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-ink-rule py-[15px] font-mono text-xs"
          >
            <span className="text-[#E5E0D8]">{cite.engine}</span>
            <span className="relative min-w-[7.5rem] text-right">
              <motion.span
                variants={askingVariants}
                className="absolute inset-0 text-[10px] tracking-[0.08em] text-[#8C857A]"
              >
                ASKING...
              </motion.span>
              <motion.span
                variants={resultVariants}
                className={
                  cite.cited
                    ? "text-[10px] tracking-[0.08em] text-primary"
                    : "text-[10px] tracking-[0.08em] text-[#8C857A]"
                }
              >
                {cite.state}
              </motion.span>
            </span>
          </motion.div>
        ))}
      </motion.div>
      <p className="mb-0 mt-5 font-mono text-[10.5px] leading-[1.6] tracking-[0.03em] text-[#8C857A]">
        A missing citation opens a task with the specific page and fact to add.
      </p>
    </div>
  );
}
