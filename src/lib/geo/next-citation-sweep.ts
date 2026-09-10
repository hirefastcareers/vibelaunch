/**
 * Citation sweeps run Mon & Thu at 06:00 UTC (vercel.json cron).
 * Used for honest "first results in X days" empty states.
 */

const SWEEP_UTC_HOUR = 6;
/** Monday = 1, Thursday = 4 (Date#getUTCDay). */
const SWEEP_UTC_DAYS = [1, 4] as const;

export type NextCitationSweep = {
  at: Date;
  /** Whole days until the next sweep (0 if later today). */
  daysUntil: number;
  /** Short label for UI, e.g. "Monday, Sep 14". */
  label: string;
};

export function getNextCitationSweep(now = new Date()): NextCitationSweep {
  const candidates: Date[] = [];

  for (let offset = 0; offset < 8; offset++) {
    const d = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + offset,
        SWEEP_UTC_HOUR,
        0,
        0,
        0
      )
    );
    if (
      (SWEEP_UTC_DAYS as readonly number[]).includes(d.getUTCDay()) &&
      d.getTime() > now.getTime()
    ) {
      candidates.push(d);
    }
  }

  const at = candidates[0]!;
  const ms = at.getTime() - now.getTime();
  const daysUntil = Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
  const label = at.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

  return { at, daysUntil, label };
}

export function formatFirstResultsMessage(now = new Date()): string {
  const next = getNextCitationSweep(now);
  if (next.daysUntil <= 0) {
    return `First results expected later today (next sweep ${next.label} 06:00 UTC).`;
  }
  if (next.daysUntil === 1) {
    return `First results expected tomorrow (${next.label}, 06:00 UTC sweep).`;
  }
  return `First results expected in about ${next.daysUntil} days (${next.label}, 06:00 UTC sweep).`;
}
