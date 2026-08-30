import { describe, it, expect } from "vitest";
import {
  calculateEri,
  rankPostsByEri,
  computeProjectEriSnapshot,
} from "@/lib/analytics/eri";

describe("ERI analytics", () => {
  it("calculates ERI from engagement metrics", () => {
    const eri = calculateEri({
      impressions: 1000,
      likes: 50,
      retweets: 10,
      replies: 5,
      clicks: 20,
    });
    // (50 + 10*2 + 5*1.5 + 20*0.5) / 1000 * 100 = 8.75
    expect(eri).toBe(8.75);
  });

  it("returns 0 ERI when impressions are 0", () => {
    expect(
      calculateEri({ impressions: 0, likes: 10, retweets: 5, replies: 2 })
    ).toBe(0);
  });

  it("ranks posts by ERI descending", () => {
    const ranked = rankPostsByEri([
      { eri: 2.5, impressions: 100 },
      { eri: 5.0, impressions: 200 },
      { eri: 3.0, impressions: 150 },
    ]);
    expect(ranked[0].eri).toBe(5.0);
    expect(ranked[2].eri).toBe(2.5);
  });

  it("computes project ERI snapshot", () => {
    const snapshot = computeProjectEriSnapshot([
      { postId: "a", eri: 4.0 },
      { postId: "b", eri: 6.0 },
      { postId: "c", eri: 2.0 },
    ]);
    expect(snapshot.avgEri).toBe(4);
    expect(snapshot.topPostId).toBe("b");
    expect(snapshot.postCount).toBe(3);
  });

  it("handles empty analytics", () => {
    const snapshot = computeProjectEriSnapshot([]);
    expect(snapshot.avgEri).toBe(0);
    expect(snapshot.topPostId).toBeNull();
    expect(snapshot.postCount).toBe(0);
  });
});
