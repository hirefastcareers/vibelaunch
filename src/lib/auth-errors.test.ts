import { describe, expect, it } from "vitest";
import { getSignInErrorMessage } from "./auth-errors";

describe("getSignInErrorMessage", () => {
  it("explains missing X OAuth credentials even without an error code", () => {
    expect(getSignInErrorMessage(undefined, false)).toMatch(/X_CLIENT_ID/);
  });

  it("explains error=twitter as a failed OAuth start", () => {
    expect(getSignInErrorMessage("twitter", true)).toMatch(/OAuth 2\.0 Client ID/);
  });

  it("explains callback mismatches", () => {
    expect(getSignInErrorMessage("OAuthCallback", true)).toMatch(
      /api\/auth\/callback\/twitter/,
    );
  });

  it("returns null when configured and there is no error", () => {
    expect(getSignInErrorMessage(undefined, true)).toBeNull();
  });
});
