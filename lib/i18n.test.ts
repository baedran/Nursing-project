import { describe, expect, test } from "vitest";
import { isLocale } from "@/lib/i18n";

describe("isLocale", () => {
  test("accepts a supported locale", () => {
    expect(isLocale("en")).toBe(true);
  });

  test("rejects an unsupported locale", () => {
    expect(isLocale("zz")).toBe(false);
  });
});
