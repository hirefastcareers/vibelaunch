import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    changelogEntry: { findFirst: vi.fn() },
    postEmbedding: { findMany: vi.fn() },
    project: { findUnique: vi.fn() },
    geoMetric: { findMany: vi.fn() },
    testRun: { create: vi.fn() },
  },
}));

import { db } from "@/lib/db";
import { runFullDiagnosticSuite } from "@/lib/agents/tester";

describe("tester agent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.changelogEntry.findFirst).mockResolvedValue(null);
    vi.mocked(db.postEmbedding.findMany).mockResolvedValue([]);
    vi.mocked(db.project.findUnique).mockResolvedValue(null);
    vi.mocked(db.geoMetric.findMany).mockResolvedValue([]);
    vi.mocked(db.testRun.create).mockResolvedValue({} as never);
  });

  it("exports runFullDiagnosticSuite from agents/tester", async () => {
    const report = await runFullDiagnosticSuite("project-1");
    expect(report.results).toHaveLength(4);
    expect(report.overallScore).toBeGreaterThanOrEqual(0);
    expect(report.overallStatus).toBeDefined();
  });
});
