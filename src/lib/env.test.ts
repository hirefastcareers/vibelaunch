import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getBaseUrl, ensureAuthEnv } from "@/lib/env";

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
});
