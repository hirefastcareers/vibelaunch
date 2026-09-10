/**
 * Product feature flags for the Xoopa GEO pivot.
 *
 * Flags default OFF for X-growth scope that is out of product for Phase 1.
 * Entangled code stays in-tree; call sites must check the flag and log skips.
 */
export const FEATURES = {
  /** ERI calculation, dashboard engagement score, virality snapshots */
  ERI_ANALYTICS: false,
  /** pgvector reinforcement driven by high-ERI posts */
  ERI_REINFORCEMENT: false,
  /** Adaptive generator inspiration from high-ERI embeddings */
  ERI_INSPIRED_GENERATION: false,
} as const;

export type FeatureFlag = keyof typeof FEATURES;

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return FEATURES[flag];
}

/** Log once per process when a flagged-off path is hit (avoid spam in hot loops). */
const loggedSkips = new Set<string>();

export function logFeatureSkip(flag: FeatureFlag, detail: string): void {
  const key = `${flag}:${detail}`;
  if (loggedSkips.has(key)) return;
  loggedSkips.add(key);
  console.info(`[feature-flag] ${flag} skipped — ${detail}`);
}
