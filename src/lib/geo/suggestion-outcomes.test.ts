import { describe, expect, it } from "vitest";
import {
  OUTCOME_AWAITING_RUN_THRESHOLD,
  buildOutcomeAggregate,
  deriveOutcomeStatus,
} from "./suggestion-outcomes";

describe("deriveOutcomeStatus", () => {
  it("needs_url when actioned but no published URL", () => {
    expect(
      deriveOutcomeStatus({
        status: "ACTIONED",
        publishedUrl: null,
        publishedAt: null,
        runsAfterPublish: 0,
        exactCount: 0,
        domainCount: 0,
      })
    ).toBe("needs_url");
  });

  it("awaiting while under the post-publish run threshold", () => {
    expect(
      deriveOutcomeStatus({
        status: "ACTIONED",
        publishedUrl: "https://xoopa.app/a",
        publishedAt: new Date(),
        runsAfterPublish: OUTCOME_AWAITING_RUN_THRESHOLD - 1,
        exactCount: 0,
        domainCount: 0,
      })
    ).toBe("awaiting");
  });

  it("not_yet_cited after enough runs with no match", () => {
    expect(
      deriveOutcomeStatus({
        status: "ACTIONED",
        publishedUrl: "https://xoopa.app/a",
        publishedAt: new Date(),
        runsAfterPublish: OUTCOME_AWAITING_RUN_THRESHOLD,
        exactCount: 0,
        domainCount: 0,
      })
    ).toBe("not_yet_cited");
  });

  it("prefers exact citation over domain-only", () => {
    expect(
      deriveOutcomeStatus({
        status: "ACTIONED",
        publishedUrl: "https://xoopa.app/a",
        publishedAt: new Date(),
        runsAfterPublish: 10,
        exactCount: 1,
        domainCount: 2,
      })
    ).toBe("cited_exact");
  });

  it("reports domain-only when host matched but not the page", () => {
    expect(
      deriveOutcomeStatus({
        status: "ACTIONED",
        publishedUrl: "https://xoopa.app/a",
        publishedAt: new Date(),
        runsAfterPublish: 10,
        exactCount: 0,
        domainCount: 1,
      })
    ).toBe("cited_domain_only");
  });
});

describe("buildOutcomeAggregate", () => {
  it("hides aggregate until enough suggestions have been observed", () => {
    const agg = buildOutcomeAggregate([
      {
        status: "ACTIONED",
        publishedUrl: "https://a.com",
        runsAfterPublish: 5,
        exactCount: 1,
        domainCount: 0,
      },
      {
        status: "ACTIONED",
        publishedUrl: "https://b.com",
        runsAfterPublish: 5,
        exactCount: 0,
        domainCount: 0,
      },
    ]);
    expect(agg.showAggregate).toBe(false);
    expect(agg.earnedExactCitation).toBe(1);
  });

  it("shows aggregate once three published fixes cleared the window", () => {
    const agg = buildOutcomeAggregate([
      {
        status: "ACTIONED",
        publishedUrl: "https://a.com",
        runsAfterPublish: 3,
        exactCount: 1,
        domainCount: 0,
      },
      {
        status: "ACTIONED",
        publishedUrl: "https://b.com",
        runsAfterPublish: 3,
        exactCount: 0,
        domainCount: 1,
      },
      {
        status: "ACTIONED",
        publishedUrl: "https://c.com",
        runsAfterPublish: 4,
        exactCount: 0,
        domainCount: 0,
      },
    ]);
    expect(agg.showAggregate).toBe(true);
    expect(agg.earnedExactCitation).toBe(1);
    expect(agg.earnedDomainOnly).toBe(1);
    expect(agg.observedEnoughRuns).toBe(3);
  });
});
