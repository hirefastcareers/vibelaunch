import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { isDemoMode } from "@/lib/demo";

describe("demo mode", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("enables when DATABASE_URL is missing", () => {
    delete process.env.DATABASE_URL;
    delete process.env.DEMO_MODE;
    expect(isDemoMode()).toBe(true);
  });

  it("enables when DATABASE_URL is placeholder", () => {
    process.env.DATABASE_URL = "postgresql://user:password@localhost:5432/vibelaunch";
    delete process.env.DEMO_MODE;
    expect(isDemoMode()).toBe(true);
  });

  it("disables when DEMO_MODE=false", () => {
    process.env.DEMO_MODE = "false";
    delete process.env.DATABASE_URL;
    expect(isDemoMode()).toBe(false);
  });

  it("forces enable when DEMO_MODE=true", () => {
    process.env.DEMO_MODE = "true";
    process.env.DATABASE_URL = "postgresql://real:pass@db.example.com/prod";
    expect(isDemoMode()).toBe(true);
  });
});
