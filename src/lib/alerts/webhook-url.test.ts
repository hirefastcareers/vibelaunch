import { describe, expect, it } from "vitest";
import { validateAlertWebhookUrl } from "./webhook-url";

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
