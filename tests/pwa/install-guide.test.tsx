import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { InstallGuide } from "@/components/pwa/InstallGuide";

// This file renders in multiple tests; the repo has no global RTL cleanup, so
// unmount between tests to keep each render isolated.
afterEach(cleanup);

const strings = {
  iphoneHeading: "On iPhone (Safari)",
  iphoneSteps: ["Tap Share", "Add to Home Screen", "Tap Add"],
  androidHeading: "On Android (Chrome)",
  androidSteps: ["Tap menu", "Install app", "Tap Install"],
  iphoneTab: "iPhone",
  androidTab: "Android",
  openInBrowserNote: "Already added? Tap the icon.",
};

describe("InstallGuide", () => {
  it("shows both platform tabs", () => {
    render(<InstallGuide strings={strings} />);
    expect(screen.getByRole("tab", { name: "iPhone" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Android" })).toBeTruthy();
  });

  it("renders the steps for the platform detected in jsdom (Android)", () => {
    render(<InstallGuide strings={strings} />);
    // jsdom's userAgent is not iOS, so the Android steps are shown.
    expect(screen.getByText("Install app")).toBeTruthy();
  });
});
