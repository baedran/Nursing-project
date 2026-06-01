import { describe, expect, test } from "vitest";
import { generateToken, shareExpiry, SHARE_TTL_DAYS } from "@/lib/portal/share";

describe("generateToken", () => {
  test("returns a long URL-safe token", () => {
    const t = generateToken();
    expect(t.length).toBeGreaterThanOrEqual(32);
    expect(t).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  test("returns a different token each call", () => {
    expect(generateToken()).not.toBe(generateToken());
  });
});

describe("shareExpiry", () => {
  test("is SHARE_TTL_DAYS (30) days after the given start", () => {
    const start = new Date("2026-06-01T00:00:00Z");
    const exp = shareExpiry(start);
    const days = (exp.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    expect(SHARE_TTL_DAYS).toBe(30);
    expect(days).toBe(30);
  });

  test("defaults to now() when no start given", () => {
    const before = Date.now();
    const exp = shareExpiry();
    const after = Date.now();
    const ttlMs = SHARE_TTL_DAYS * 24 * 60 * 60 * 1000;
    expect(exp.getTime()).toBeGreaterThanOrEqual(before + ttlMs - 5);
    expect(exp.getTime()).toBeLessThanOrEqual(after + ttlMs + 5);
  });
});
