const PLACEHOLDER_MARKERS = ["placeholder", "test-", "user:password@localhost", "sk-test-"];

function isConfigured(value: string | undefined): boolean {
  const trimmed = value?.trim();
  if (!trimmed) return false;
  return !PLACEHOLDER_MARKERS.some((marker) => trimmed.includes(marker));
}

/**
 * Returns true when running in standalone demo mode (no live API keys / DB required).
 * Enabled when NEXT_PUBLIC_DEMO_MODE="true" or critical env vars are missing.
 */
export function isDemoMode(): boolean {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") return true;
  if (process.env.DEMO_MODE === "true") return true;
  if (process.env.DEMO_MODE === "false") return false;

  const hasDatabase = isConfigured(process.env.DATABASE_URL);
  const hasOpenAI = isConfigured(process.env.OPENAI_API_KEY);
  const hasX =
    isConfigured(process.env.X_API_KEY) ||
    isConfigured(process.env.X_CLIENT_ID);

  return !hasDatabase || !hasOpenAI || !hasX;
}

/** Simulate network latency for demo API responses */
export async function demoDelay(ms = 1000): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
