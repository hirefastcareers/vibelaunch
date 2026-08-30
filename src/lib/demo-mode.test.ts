import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { isDemoMode } from "@/lib/demo-mode";

describe("demo-mode", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("enables when NEXT_PUBLIC_DEMO_MODE is true", () => {
    process.env.NEXT_PUBLIC_DEMO_MODE = "true";
    expect(isDemoMode()).toBe(true);
  });

  it("enables when critical keys are all missing", () => {
    delete process.env.NEXT_PUBLIC_DEMO_MODE;
    delete process.env.DATABASE_URL;
    delete process.env.OPENAI_API_KEY;
    delete process.env.X_CLIENT_ID;
    delete process.env.X_API_KEY;
    expect(isDemoMode()).toBe(true);
  });

  it("enables when only DATABASE_URL is missing", () => {
    delete process.env.DATABASE_URL;
    process.env.OPENAI_API_KEY = "sk-real-key";
    process.env.X_CLIENT_ID = "real-client-id";
    expect(isDemoMode()).toBe(true);
  });

  it("disables when DEMO_MODE=false", () => {
    process.env.DEMO_MODE = "false";
    delete process.env.DATABASE_URL;
    expect(isDemoMode()).toBe(false);
  });

  it("disables when all keys are configured with real values", () => {
    process.env.DEMO_MODE = "false";
    process.env.DATABASE_URL = "postgresql://real:pass@db.example.com/prod";
    process.env.OPENAI_API_KEY = "sk-real-production-key";
    process.env.X_CLIENT_ID = "real-production-client-id";
    expect(isDemoMode()).toBe(false);
  });

  it("treats placeholder values as unconfigured", () => {
    process.env.DATABASE_URL = "postgresql://user:password@localhost:5432/vibelaunch";
    process.env.OPENAI_API_KEY = "sk-test-openai-key-placeholder";
    process.env.X_CLIENT_ID = "test-x-client-id";
    expect(isDemoMode()).toBe(true);
  });
});
