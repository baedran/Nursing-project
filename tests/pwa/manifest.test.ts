import { describe, it, expect } from "vitest";
import manifest from "@/app/manifest";

describe("web app manifest", () => {
  it("declares a standalone installable app opening into the nurse portal", () => {
    const m = manifest();
    expect(m.name).toBe("Caregivers Collective");
    expect(m.short_name).toBe("Caregivers");
    expect(m.display).toBe("standalone");
    expect(m.start_url).toBe("/en/portal");
    expect(m.background_color).toBe("#f7f7f3");
    expect(m.theme_color).toBe("#1a504f");
  });

  it("ships the icon sizes phones require, including a maskable icon", () => {
    const m = manifest();
    const icons = m.icons ?? [];
    const sizes = icons.map((i) => i.sizes);
    expect(sizes).toContain("192x192");
    expect(sizes).toContain("512x512");
    expect(icons.some((i) => i.purpose === "maskable")).toBe(true);
  });
});
