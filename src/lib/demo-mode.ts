/**
 * Explicit demo / stub gate. Never invent live metrics unless this returns true.
 *
 * Opt-in only via DEMO_MODE or NEXT_PUBLIC_DEMO_MODE. Missing API keys alone
 * must not flip this on (that auto-path was removed for honesty).
 */
export function isDemoMode(): boolean {
  return (
    process.env.NEXT_PUBLIC_DEMO_MODE === "true" ||
    process.env.DEMO_MODE === "true"
  );
}

/** Simulate network latency for demo API responses */
export async function demoDelay(ms = 600): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
