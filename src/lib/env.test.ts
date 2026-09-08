import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  getBaseUrl,
  ensureAuthEnv,
  getXOauthCredentials,
  isXOauthConfigured,
  getXOauthCallbackUrl,
  getXOauthCallbackAllowlist,
  isLocalUrl,
  getRequestOrigin,
  applyRequestAuthUrl,
} from "@/lib/env";

describe("env helpers", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("falls back to localhost when env vars are empty", () => {
    process.env.NEXTAUTH_URL = "";
    process.env.NEXT_PUBLIC_APP_URL = "";
    process.env.APP_URL = "";
    delete process.env.VERCEL_URL;
    expect(getBaseUrl()).toBe("http://localhost:3000");
  });

  it("prefers NEXTAUTH_URL when set", () => {
    process.env.NEXTAUTH_URL = "https://app.example.com/";
    expect(getBaseUrl()).toBe("https://app.example.com");
  });

  it("uses VERCEL_URL when other vars are unset", () => {
    delete process.env.NEXTAUTH_URL;
    delete process.env.APP_URL;
    process.env.VERCEL_URL = "my-app.vercel.app";
    expect(getBaseUrl()).toBe("https://my-app.vercel.app");
  });

  it("ensureAuthEnv sets NEXTAUTH_URL when empty", () => {
    process.env.NEXTAUTH_URL = "";
    ensureAuthEnv();
    expect(process.env.NEXTAUTH_URL).toBe("http://localhost:3000");
  });

  it("skips localhost NEXTAUTH_URL on Vercel", () => {
    process.env.VERCEL = "1";
    process.env.NEXTAUTH_URL = "http://localhost:3000";
    process.env.VERCEL_URL = "vibelaunch-nu.vercel.app";
    delete process.env.APP_URL;
    delete process.env.NEXT_PUBLIC_APP_URL;
    expect(getBaseUrl()).toBe("https://vibelaunch-nu.vercel.app");
    ensureAuthEnv();
    expect(process.env.NEXTAUTH_URL).toBeUndefined();
  });

  it("reads the request origin from forwarded headers", () => {
    const origin = getRequestOrigin(
      new Headers({
        "x-forwarded-host": "vibelaunch-nu.vercel.app",
        "x-forwarded-proto": "https",
      }),
    );
    expect(origin).toBe("https://vibelaunch-nu.vercel.app");
  });

  it("unpins NEXTAUTH_URL on Vercel so NextAuth uses the request host", () => {
    process.env.VERCEL = "1";
    process.env.NEXTAUTH_URL = "http://localhost:3000";
    const origin = applyRequestAuthUrl(
      new Headers({
        host: "vibelaunch-nu.vercel.app",
        "x-forwarded-proto": "https",
      }),
    );
    expect(origin).toBe("https://vibelaunch-nu.vercel.app");
    expect(process.env.NEXTAUTH_URL).toBeUndefined();
  });

  it("points NextAuth at the request origin locally", () => {
    delete process.env.VERCEL;
    process.env.NEXTAUTH_URL = "http://localhost:3000";
    const origin = applyRequestAuthUrl(
      new Headers({
        host: "localhost:3000",
        "x-forwarded-proto": "http",
      }),
    );
    expect(origin).toBe("http://localhost:3000");
    expect(process.env.NEXTAUTH_URL).toBe("http://localhost:3000");
  });

  it("detects local URLs", () => {
    expect(isLocalUrl("http://localhost:3000")).toBe(true);
    expect(isLocalUrl("https://vibelaunch-nu.vercel.app")).toBe(false);
  });

  it("treats empty X OAuth strings as unset", () => {
    process.env.X_CLIENT_ID = "";
    process.env.X_CLIENT_SECRET = "  ";
    delete process.env.TWITTER_CLIENT_ID;
    delete process.env.TWITTER_CLIENT_SECRET;
    expect(isXOauthConfigured()).toBe(false);
  });

  it("accepts TWITTER_CLIENT_* aliases", () => {
    delete process.env.X_CLIENT_ID;
    delete process.env.X_CLIENT_SECRET;
    process.env.TWITTER_CLIENT_ID = "id-from-alias";
    process.env.TWITTER_CLIENT_SECRET = "secret-from-alias";
    expect(getXOauthCredentials()).toEqual({
      clientId: "id-from-alias",
      clientSecret: "secret-from-alias",
    });
    expect(isXOauthConfigured()).toBe(true);
  });

  it("builds the NextAuth X callback URL from the app origin", () => {
    process.env.NEXTAUTH_URL = "http://localhost:3000";
    expect(getXOauthCallbackUrl()).toBe(
      "http://localhost:3000/api/auth/callback/twitter",
    );
    expect(getXOauthCallbackAllowlist()).toEqual([
      "http://localhost:3000/api/auth/callback/twitter",
      "http://127.0.0.1:3000/api/auth/callback/twitter",
    ]);
  });

  it("lists both live production callbacks", () => {
    expect(
      getXOauthCallbackAllowlist("https://vibelaunch-nu.vercel.app"),
    ).toEqual([
      "https://vibelaunch-nu.vercel.app/api/auth/callback/twitter",
      "https://xoopa.app/api/auth/callback/twitter",
    ]);
  });
});
