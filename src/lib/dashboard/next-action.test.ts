import { describe, expect, it } from "vitest";
import { displayHandle, getNextAction } from "./next-action";

describe("getNextAction", () => {
  it("asks for a project when none exist", () => {
    expect(
      getNextAction({
        projectCount: 0,
        draftCount: 2,
        publishedCount: 0,
        articleCount: 0,
      })
    ).toMatchObject({
      href: "/onboard",
      cta: "Set up a project",
    });
  });

  it("points at pending drafts before anything else", () => {
    const action = getNextAction({
      projectCount: 1,
      draftCount: 3,
      publishedCount: 0,
      articleCount: 0,
    });
    expect(action.title).toBe("3 drafts are waiting");
    expect(action.href).toBe("/dashboard/queue");
  });

  it("uses singular copy for one draft", () => {
    expect(
      getNextAction({
        projectCount: 1,
        draftCount: 1,
        publishedCount: 4,
        articleCount: 2,
      }).title
    ).toBe("1 draft is waiting");
  });

  it("asks for a first post when the queue is empty", () => {
    expect(
      getNextAction({
        projectCount: 1,
        draftCount: 0,
        publishedCount: 0,
        articleCount: 0,
      }).href
    ).toBe("/dashboard/queue?generate=true");
  });

  it("asks for an article after posts are live", () => {
    expect(
      getNextAction({
        projectCount: 1,
        draftCount: 0,
        publishedCount: 2,
        articleCount: 0,
      }).href
    ).toBe("/dashboard#articles");
  });

  it("falls back to generating another post", () => {
    expect(
      getNextAction({
        projectCount: 1,
        draftCount: 0,
        publishedCount: 2,
        articleCount: 1,
      }).href
    ).toBe("/dashboard/queue?generate=true");
  });
});

describe("displayHandle", () => {
  it("prefers the X username", () => {
    expect(displayHandle({ name: "Tom", xUsername: "tom" })).toBe("@tom");
  });

  it("falls back to name", () => {
    expect(displayHandle({ name: "Tom", xUsername: null })).toBe("Tom");
  });
});
