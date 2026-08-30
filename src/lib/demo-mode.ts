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

export type MockTestSuite =
  | "seo_audit"
  | "feedback_loop"
  | "media_render"
  | "geo_audit";

export interface MockTestSuiteResult {
  suite: MockTestSuite;
  status: "passed" | "failed" | "warning";
  score: number;
  details: Record<string, unknown>;
}

const MOCK_TEST_RESULTS: Record<MockTestSuite, MockTestSuiteResult> = {
  seo_audit: {
    suite: "seo_audit",
    status: "passed",
    score: 90,
    details: {
      assertions: {
        hasCanonical: true,
        hasOGImage: true,
        hasJsonLd: true,
        wordCountGreaterThan800: false,
      },
      evaluatedUrl: "/changelog/v2-adaptive-ai-launch",
      wordCount: 620,
    },
  },
  feedback_loop: {
    suite: "feedback_loop",
    status: "warning",
    score: 75,
    details: {
      embeddingsCount: 3,
      vectorSearchReady: true,
      message: "pgvector historical hooks successfully cached.",
    },
  },
  media_render: {
    suite: "media_render",
    status: "passed",
    score: 100,
    details: {
      playwrightConfigured: true,
      targetUrl: "https://vibelaunch.app",
      viewportSize: "1280x720",
    },
  },
  geo_audit: {
    suite: "geo_audit",
    status: "warning",
    score: 55.6,
    details: {
      totalQueriesChecked: 9,
      citationsFound: 5,
      providers: ["perplexity", "chatgpt", "claude"],
    },
  },
};

/** Per-suite mock results for diagnostic runner in demo mode */
export function getMockTestResults(suite: MockTestSuite): MockTestSuiteResult {
  return { ...MOCK_TEST_RESULTS[suite] };
}
