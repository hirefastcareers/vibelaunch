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
import { runFullDiagnosticSuite } from "@/lib/diagnostics/runner";

describe("diagnostic runner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.changelogEntry.findFirst).mockResolvedValue(null);
    vi.mocked(db.postEmbedding.findMany).mockResolvedValue([]);
    vi.mocked(db.project.findUnique).mockResolvedValue(null);
    vi.mocked(db.geoMetric.findMany).mockResolvedValue([]);
    vi.mocked(db.testRun.create).mockResolvedValue({} as never);
  });

  it("runs all suites and persists results", async () => {
    const result = await runFullDiagnosticSuite("project-1");
    expect(result.results).toHaveLength(4);
    expect(["passed", "warning", "failed"]).toContain(result.overallStatus);
    expect(db.testRun.create).toHaveBeenCalledTimes(4);
  });
});
