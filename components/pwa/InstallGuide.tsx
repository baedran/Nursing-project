"use client";

import { useEffect, useState } from "react";

type Platform = "iphone" | "android";

type Strings = {
  iphoneHeading: string;
  iphoneSteps: string[];
  androidHeading: string;
  androidSteps: string[];
  iphoneTab: string;
  androidTab: string;
  openInBrowserNote: string;
};

export function InstallGuide({ strings }: { strings: Strings }) {
  const [platform, setPlatform] = useState<Platform>("iphone");

  useEffect(() => {
    const ua = navigator.userAgent;
    // iPad on iOS 13+ reports as "Macintosh"; treat a touch-capable Mac as iOS.
    const isIOS =
      /iPhone|iPad|iPod/.test(ua) ||
      (/Macintosh/.test(ua) && "ontouchend" in document);
    setPlatform(isIOS ? "iphone" : "android");
  }, []);

  const heading = platform === "iphone" ? strings.iphoneHeading : strings.androidHeading;
  const steps = platform === "iphone" ? strings.iphoneSteps : strings.androidSteps;

  const tabBase =
    "rounded-full px-4 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-teal";
  const active = "bg-teal text-white";
  const inactive = "bg-paper-cool text-ink-soft hover:bg-rule";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2" role="tablist" aria-label="Choose your phone">
        <button
          type="button"
          role="tab"
          aria-selected={platform === "iphone"}
          onClick={() => setPlatform("iphone")}
          className={`${tabBase} ${platform === "iphone" ? active : inactive}`}
        >
          {strings.iphoneTab}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={platform === "android"}
          onClick={() => setPlatform("android")}
          className={`${tabBase} ${platform === "android" ? active : inactive}`}
        >
          {strings.androidTab}
        </button>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-teal-deep">{heading}</h2>
        <ol className="mt-3 flex flex-col gap-3">
          {steps.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal text-xs font-semibold text-white">
                {i + 1}
              </span>
              <span className="text-ink-soft">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <p className="text-sm text-muted">{strings.openInBrowserNote}</p>
    </div>
  );
}
