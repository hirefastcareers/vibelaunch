import { describe, expect, it, vi } from "vitest";
import {
  assertWebhookDnsSafe,
  isPrivateOrBlockedIp,
  validateAlertWebhookUrl,
} from "./webhook-url";

describe("validateAlertWebhookUrl", () => {
  it("accepts https public URLs", () => {
    const r = validateAlertWebhookUrl("https://hooks.example.com/xoopa");
    expect(r.ok).toBe(true);
  });

  it("blocks localhost and private IPs", () => {
    expect(validateAlertWebhookUrl("http://localhost:3000/hook").ok).toBe(false);
    expect(validateAlertWebhookUrl("http://127.0.0.1/hook").ok).toBe(false);
    expect(validateAlertWebhookUrl("http://10.0.0.5/hook").ok).toBe(false);
    expect(validateAlertWebhookUrl("http://192.168.1.1/hook").ok).toBe(false);
  });

  it("blocks IPv4-mapped IPv6 and trailing-dot localhost", () => {
    expect(
      validateAlertWebhookUrl("http://[::ffff:127.0.0.1]/hook").ok
    ).toBe(false);
    expect(
      validateAlertWebhookUrl("http://[::ffff:10.0.0.1]/hook").ok
    ).toBe(false);
    expect(validateAlertWebhookUrl("http://localhost./hook").ok).toBe(false);
    expect(validateAlertWebhookUrl("http://[::1]/hook").ok).toBe(false);
  });

  it("rejects non-http schemes", () => {
    expect(validateAlertWebhookUrl("ftp://example.com/x").ok).toBe(false);
  });
});

describe("assertWebhookDnsSafe (send-time rebind guard)", () => {
  it("rejects when a previously-public hostname resolves to a private IP", async () => {
    const resolveDns = vi.fn(async () => [
      { address: "127.0.0.1", family: 4 as const },
    ]);

    const result = await assertWebhookDnsSafe(
      "https://hooks.example.com/xoopa",
      resolveDns
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/private or blocked address/i);
    }
    expect(resolveDns).toHaveBeenCalledWith("hooks.example.com");
  });

  it("allows when DNS resolves only to public addresses", async () => {
    const resolveDns = vi.fn(async () => [
      { address: "93.184.216.34", family: 4 as const },
    ]);

    const result = await assertWebhookDnsSafe(
      "https://hooks.example.com/xoopa",
      resolveDns
    );

    expect(result).toEqual({
      ok: true,
      url: "https://hooks.example.com/xoopa",
    });
  });

  it("rejects if any resolved address is private (mixed A/AAAA)", async () => {
    const resolveDns = vi.fn(async () => [
      { address: "93.184.216.34", family: 4 as const },
      { address: "::1", family: 6 as const },
    ]);

    const result = await assertWebhookDnsSafe(
      "https://hooks.example.com/xoopa",
      resolveDns
    );
    expect(result.ok).toBe(false);
  });
});

describe("isPrivateOrBlockedIp", () => {
  it("flags loopback and RFC1918", () => {
    expect(isPrivateOrBlockedIp("127.0.0.1")).toBe(true);
    expect(isPrivateOrBlockedIp("10.1.2.3")).toBe(true);
    expect(isPrivateOrBlockedIp("8.8.8.8")).toBe(false);
  });
});
