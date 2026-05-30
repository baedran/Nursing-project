import { describe, expect, test } from "vitest";
import { resolveRole } from "@/lib/portal/roles";

describe("resolveRole", () => {
  test("returns the profile role when valid", () => {
    expect(resolveRole({ role: "coordinator" })).toBe("coordinator");
    expect(resolveRole({ role: "nurse" })).toBe("nurse");
    expect(resolveRole({ role: "family" })).toBe("family");
  });

  test("defaults to family when profile is null", () => {
    expect(resolveRole(null)).toBe("family");
  });

  test("defaults to family for an unknown role", () => {
    expect(resolveRole({ role: "admin" })).toBe("family");
  });
});
