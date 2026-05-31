import { describe, expect, test } from "vitest";
import { formatBeirut } from "@/lib/portal/datetime";

describe("formatBeirut", () => {
  test("formats an ISO timestamp in Beirut time", () => {
    // 2026-05-14T15:30:00Z = 18:30 in Beirut (UTC+3 in summer).
    expect(formatBeirut("2026-05-14T15:30:00Z")).toBe("Thu 14 May · 18:30");
  });

  test("returns an em-dash for null/empty", () => {
    expect(formatBeirut(null)).toBe("—");
    expect(formatBeirut(undefined)).toBe("—");
    expect(formatBeirut("")).toBe("—");
  });

  test("returns an em-dash for an invalid date", () => {
    expect(formatBeirut("not-a-date")).toBe("—");
  });
});
