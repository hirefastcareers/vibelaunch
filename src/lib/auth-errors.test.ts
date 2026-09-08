import { describe, expect, it } from "vitest";
import { getSignInErrorMessage } from "./auth-errors";

describe("getSignInErrorMessage", () => {
  it("explains missing X OAuth credentials even without an error code", () => {
    expect(getSignInErrorMessage(undefined, false)).toMatch(/X_CLIENT_ID/);
  });

  it("explains error=twitter as a failed OAuth start", () => {
    expect(getSignInErrorMessage("twitter", true)).toMatch(/OAuth 2\.0 Client ID/);
  });

  it("explains callback mismatches with the live callback URI", () => {
    expect(
      getSignInErrorMessage("OAuthCallback", true, [
        "https://vibelaunch-nu.vercel.app/api/auth/callback/twitter",
      ]),
    ).toMatch(/Callback URI listed on this page/);
    expect(getSignInErrorMessage("OAuthCallback", true, [])).not.toMatch(/localhost:3000/);
  });

  it("does not blame the X portal when the database cannot save the login", () => {
    expect(getSignInErrorMessage("Callback", true)).toMatch(/database was busy/);
    expect(getSignInErrorMessage("Callback", true)).not.toMatch(/Callback URI/);
  });

  it("returns null when configured and there is no error", () => {
    expect(getSignInErrorMessage(undefined, true)).toBeNull();
  });
});
