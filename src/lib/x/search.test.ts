import { describe, expect, it } from "vitest";
import { getAppSearchBearer, isRepliesSearchConfigured } from "./search";

describe("replies search config", () => {
  it("treats X_API_KEY as an app search bearer", () => {
    const prevKey = process.env.X_API_KEY;
    const prevBearer = process.env.X_BEARER_TOKEN;
    delete process.env.X_BEARER_TOKEN;
    process.env.X_API_KEY = "app-bearer";

    expect(getAppSearchBearer()).toBe("app-bearer");
    expect(isRepliesSearchConfigured(false)).toBe(true);

    if (prevKey !== undefined) process.env.X_API_KEY = prevKey;
    else delete process.env.X_API_KEY;
    if (prevBearer !== undefined) process.env.X_BEARER_TOKEN = prevBearer;
  });

  it("allows user OAuth when no app bearer is set", () => {
    const prevKey = process.env.X_API_KEY;
    const prevBearer = process.env.X_BEARER_TOKEN;
    delete process.env.X_API_KEY;
    delete process.env.X_BEARER_TOKEN;

    expect(getAppSearchBearer()).toBeNull();
    expect(isRepliesSearchConfigured(false)).toBe(false);
    expect(isRepliesSearchConfigured(true)).toBe(true);

    if (prevKey !== undefined) process.env.X_API_KEY = prevKey;
    if (prevBearer !== undefined) process.env.X_BEARER_TOKEN = prevBearer;
  });
});
