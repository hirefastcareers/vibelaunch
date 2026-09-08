import { describe, expect, it } from "vitest";
import { toServerlessDatabaseUrl } from "./database-url";

describe("toServerlessDatabaseUrl", () => {
  it("moves Supabase session-mode pooling onto the transaction port", () => {
    const result = toServerlessDatabaseUrl(
      "postgresql://postgres.abc:secret@aws-1-eu-west-1.pooler.supabase.com:5432/postgres",
    );
    const url = new URL(result!);
    expect(url.port).toBe("6543");
    expect(url.searchParams.get("pgbouncer")).toBe("true");
    expect(url.searchParams.get("connection_limit")).toBe("1");
    expect(url.password).toBe("secret");
  });

  it("rewrites Neon direct hosts onto the pooler", () => {
    const result = toServerlessDatabaseUrl(
      "postgresql://user:pass@ep-cool-name-123.eu-west-2.aws.neon.tech/neondb?sslmode=require",
    );
    const url = new URL(result!);
    expect(url.hostname).toBe("ep-cool-name-123-pooler.eu-west-2.aws.neon.tech");
    expect(url.searchParams.get("pgbouncer")).toBe("true");
  });

  it("leaves localhost URLs unchanged", () => {
    const local = "postgresql://user:password@localhost:5432/vibelaunch";
    expect(toServerlessDatabaseUrl(local)).toBe(local);
  });
});
