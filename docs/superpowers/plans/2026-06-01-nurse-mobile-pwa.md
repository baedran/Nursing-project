# Nurse Mobile App (PWA) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing portal installable on a phone's home screen as a full-screen app, reusing every screen, with no patient data ever stored in the device cache.

**Architecture:** Add the web-app "installable" layer on top of the current Next.js 16 App Router site: a manifest route, a designed brand icon set, a tiny hand-written service worker scoped to non-PHI static assets only, Apple meta tags, and a standalone install-help page. No portal screens change.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, `sharp` (dev-only, icon generation), Vitest + React Testing Library, Vercel hosting.

**Spec:** `docs/superpowers/specs/2026-06-01-nurse-mobile-pwa-design.md`

---

## File Structure

- `app/manifest.ts` — **create.** Web app manifest (name, icons, colors, standalone, start_url).
- `tests/pwa/manifest.test.ts` — **create.** Asserts manifest shape.
- `assets/icon.svg` — **create.** Source brand monogram (teal mark on paper / reverse).
- `scripts/generate-icons.mjs` — **create.** Rasterizes the SVG to the PNG sizes.
- `public/icons/icon-192.png`, `icon-512.png`, `icon-maskable-512.png` — **generated.**
- `app/icon.png` — **generated.** Favicon (Next auto-links).
- `app/apple-icon.png` — **generated.** iPhone home-screen icon (Next auto-links).
- `public/sw.js` — **create.** Minimal service worker, static assets only.
- `public/offline.html` — **create.** PHI-free offline fallback page.
- `components/pwa/RegisterServiceWorker.tsx` — **create.** Client component, registers SW in production.
- `app/[locale]/layout.tsx` — **modify.** Add manifest link + Apple meta + themeColor + mount RegisterServiceWorker.
- `app/[locale]/install/page.tsx` — **create.** Install help page (server: loads dict).
- `components/pwa/InstallGuide.tsx` — **create.** Client: detects iOS/Android, shows steps, manual toggle.
- `tests/pwa/install-guide.test.tsx` — **create.** Render test for both platforms.
- `messages/en.json`, `messages/ar.json` — **modify.** Add `install.*` strings.
- `HANDOFF.md` — **modify.** New banner documenting the PWA.

---

## Task 1: App manifest

**Files:**
- Create: `app/manifest.ts`
- Test: `tests/pwa/manifest.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/pwa/manifest.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- manifest`
Expected: FAIL — cannot find module `@/app/manifest`.

- [ ] **Step 3: Write the manifest**

```ts
// app/manifest.ts
import type { MetadataRoute } from "next";

// Web app manifest — the small file that lets a phone "install" the portal to
// the home screen and open it full-screen. Served at /manifest.webmanifest.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Caregivers Collective",
    short_name: "Caregivers",
    description:
      "Document home-care visits — vitals, notes, and wound photos — for Caregivers Collective nurses.",
    start_url: "/en/portal",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f7f7f3",
    theme_color: "#1a504f",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- manifest`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add app/manifest.ts tests/pwa/manifest.test.ts
git commit -m "feat(pwa): web app manifest for installable nurse app"
```

---

## Task 2: Brand icon set

No logo image exists (brand is a text wordmark), so the icon is designed: a
single warm "C" cradling a small circle (a person being cared for), in the
brand teal on paper — or paper on teal for the maskable/Apple versions which
need a filled background.

**Files:**
- Create: `assets/icon.svg`, `assets/icon-maskable.svg`
- Create: `scripts/generate-icons.mjs`
- Generated: `public/icons/icon-192.png`, `public/icons/icon-512.png`, `public/icons/icon-maskable-512.png`, `app/icon.png`, `app/apple-icon.png`

- [ ] **Step 1: Add `sharp` as a dev dependency**

Run: `npm install -D sharp`
Expected: installs without error.

- [ ] **Step 2: Author the source SVG (transparent, for `any` icons + favicon)**

```xml
<!-- assets/icon.svg : 512x512, transparent background -->
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="112" fill="#f7f7f3"/>
  <!-- sheltering C -->
  <path d="M352 150a150 150 0 1 0 0 212" fill="none" stroke="#1a504f"
        stroke-width="44" stroke-linecap="round"/>
  <!-- the cared-for person -->
  <circle cx="300" cy="256" r="40" fill="#2f7a76"/>
</svg>
```

- [ ] **Step 3: Author the maskable SVG (filled bg, content inside the safe zone)**

Maskable icons get cropped to a circle by Android; keep the mark within the
center ~60% and fill the whole square with the brand color.

```xml
<!-- assets/icon-maskable.svg : 512x512, full-bleed teal -->
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#1a504f"/>
  <g transform="translate(256,256) scale(0.62) translate(-256,-256)">
    <path d="M352 150a150 150 0 1 0 0 212" fill="none" stroke="#f7f7f3"
          stroke-width="44" stroke-linecap="round"/>
    <circle cx="300" cy="256" r="40" fill="#4ec19a"/>
  </g>
</svg>
```

- [ ] **Step 4: Write the generator script**

```js
// scripts/generate-icons.mjs
// Rasterizes the brand SVGs into the PNG sizes phones need. Re-runnable.
import sharp from "sharp";
import { readFileSync, mkdirSync } from "node:fs";

mkdirSync("public/icons", { recursive: true });
const any = readFileSync("assets/icon.svg");
const maskable = readFileSync("assets/icon-maskable.svg");

const jobs = [
  [any, 192, "public/icons/icon-192.png"],
  [any, 512, "public/icons/icon-512.png"],
  [maskable, 512, "public/icons/icon-maskable-512.png"],
  [maskable, 180, "app/apple-icon.png"], // iPhone: no transparency, filled bg
  [any, 512, "app/icon.png"],            // favicon source
];

for (const [svg, size, out] of jobs) {
  await sharp(svg, { density: 384 }).resize(size, size).png().toFile(out);
  console.log("wrote", out);
}
```

- [ ] **Step 5: Generate the icons**

Run: `node scripts/generate-icons.mjs`
Expected: prints `wrote ...` for all five files; files exist.

- [ ] **Step 6: Review the icon in the browser, then commit**

Open `public/icons/icon-512.png` and `app/apple-icon.png` to confirm the mark
reads clearly at small size. Adjust the SVG and re-run if needed.

```bash
git add assets/ scripts/generate-icons.mjs public/icons app/icon.png app/apple-icon.png package.json package-lock.json
git commit -m "feat(pwa): designed brand app icons (any + maskable + apple)"
```

---

## Task 3: Service worker + offline fallback + registration

**Files:**
- Create: `public/sw.js`, `public/offline.html`, `components/pwa/RegisterServiceWorker.tsx`

- [ ] **Step 1: Write the service worker (static assets only — never PHI)**

```js
// public/sw.js
// Minimal service worker. Two jobs only: (1) make the app installable on
// Android, (2) launch fast + show a friendly page when truly offline.
// PHI RULE: caches ONLY same-origin static assets. Never caches portal pages,
// summaries, wound photos, or any Supabase/API response.
const CACHE = "cgc-static-v2";
const PRECACHE = ["/offline.html", "/icons/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return; // writes always hit the network

  const url = new URL(req.url);
  const isStaticAsset =
    url.origin === self.location.origin &&
    (url.pathname.startsWith("/_next/static/") ||
      url.pathname.startsWith("/icons/") ||
      url.pathname === "/offline.html");

  // Static assets: cache-first (they are immutable / non-PHI).
  if (isStaticAsset) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
            return res;
          })
      )
    );
    return;
  }

  // Page navigations: network-only, fall back to the offline page if offline.
  if (req.mode === "navigate") {
    event.respondWith(fetch(req).catch(() => caches.match("/offline.html")));
    return;
  }

  // Everything else (data, photos, APIs): network-only. Nothing cached.
});
```

- [ ] **Step 2: Write the offline fallback page (PHI-free static HTML)**

```html
<!-- public/offline.html -->
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>No connection — Caregivers Collective</title>
    <style>
      body { margin: 0; min-height: 100vh; display: grid; place-items: center;
challenge: 0;
        font-family: system-ui, -apple-system, sans-serif; background: #f7f7f3; color: #1f2a35; }
      .card { text-align: center; padding: 2rem; max-width: 22rem; }
      h1 { font-size: 1.25rem; margin: 1rem 0 0.5rem; color: #1a504f; }
      p { color: #454e58; line-height: 1.5; }
      .dot { width: 12px; height: 12px; border-radius: 50%; background: #4ec19a; display: inline-block; }
    </style>
  </head>
  <body>
    <div class="card">
      <span class="dot"></span>
      <h1>No connection</h1>
      <p>You're offline. Reconnect to Wi-Fi or mobile data to document a visit, then reopen the app.</p>
    </div>
  </body>
</html>
```

NOTE during execution: remove the stray `challenge: 0;` line above — it is not
valid CSS (typo guard). Final `body` rule should read:
`body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: system-ui, -apple-system, sans-serif; background: #f7f7f3; color: #1f2a35; }`

- [ ] **Step 3: Write the registration component (production only)**

```tsx
// components/pwa/RegisterServiceWorker.tsx
"use client";

import { useEffect } from "react";

// Registers the service worker after load. Production-only: a SW in dev fights
// with hot-reload. Renders nothing.
export function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Registration failure must never break the app — silently ignore.
    });
  }, []);

  return null;
}
```

- [ ] **Step 4: Commit**

```bash
git add public/sw.js public/offline.html components/pwa/RegisterServiceWorker.tsx
git commit -m "feat(pwa): minimal service worker (static-only) + offline page"
```

---

## Task 4: Wire manifest, Apple meta, theme color, and SW registration into the layout

**Files:**
- Modify: `app/[locale]/layout.tsx`

- [ ] **Step 1: Add `manifest` + `appleWebApp` to the returned metadata**

In `generateMetadata`'s returned object (after `robots`), add:

```ts
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      title: "Caregivers",
      statusBarStyle: "default",
    },
```

- [ ] **Step 2: Export a `viewport` with the brand theme color**

Add near the top of `app/[locale]/layout.tsx` (after imports):

```ts
import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#1a504f",
};
```

(Adjust the existing `import type { Metadata } from "next";` line to also import `Viewport`.)

- [ ] **Step 3: Mount the service-worker registration in `<body>`**

Add the import:

```ts
import { RegisterServiceWorker } from "@/components/pwa/RegisterServiceWorker";
```

And inside `<body>`, just before `<Topbar ... />`:

```tsx
        <RegisterServiceWorker />
```

- [ ] **Step 4: Verify the build wires it up**

Run: `npm run build`
Expected: build succeeds. (Manifest is generated at `/manifest.webmanifest`; `app/icon.png` + `app/apple-icon.png` auto-linked.)

- [ ] **Step 5: Commit**

```bash
git add app/[locale]/layout.tsx
git commit -m "feat(pwa): link manifest, apple meta, theme color; register SW"
```

---

## Task 5: Install help page (iPhone + Android steps)

**Files:**
- Create: `app/[locale]/install/page.tsx`, `components/pwa/InstallGuide.tsx`
- Modify: `messages/en.json`, `messages/ar.json`
- Test: `tests/pwa/install-guide.test.tsx`

- [ ] **Step 1: Add i18n strings**

Add an `install` block to `messages/en.json` (top level):

```json
  "install": {
    "title": "Install the Caregivers app",
    "intro": "Add this to your phone's home screen so it opens like an app — no app store needed.",
    "iphoneHeading": "On iPhone (Safari)",
    "iphoneSteps": [
      "Tap the Share button (the square with an arrow) at the bottom.",
      "Scroll down and tap \"Add to Home Screen\".",
      "Tap \"Add\" — the Caregivers icon now sits on your home screen."
    ],
    "androidHeading": "On Android (Chrome)",
    "androidSteps": [
      "Tap the three-dot menu at the top right.",
      "Tap \"Install app\" (or \"Add to Home screen\").",
      "Tap \"Install\" — the Caregivers icon now sits on your home screen."
    ],
    "iphoneTab": "iPhone",
    "androidTab": "Android",
    "openInBrowserNote": "Already added? Just tap the Caregivers icon to open it."
  },
```

Add the same `install` block to `messages/ar.json` using the existing Arabic
placeholder convention in that file (mirror the English keys; translation review
is already a tracked deferral for ar.json).

- [ ] **Step 2: Write the client install guide**

```tsx
// components/pwa/InstallGuide.tsx
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
    // iPad on iOS 13+ reports as Mac; treat touch-capable "Mac" as iPhone path.
    const isIOS = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && "ontouchend" in document);
    setPlatform(isIOS ? "iphone" : "android");
  }, []);

  const heading = platform === "iphone" ? strings.iphoneHeading : strings.androidHeading;
  const steps = platform === "iphone" ? strings.iphoneSteps : strings.androidSteps;

  const tabBase = "rounded-full px-4 py-2 text-sm font-medium transition";
  const active = "bg-teal text-white";
  const inactive = "bg-paper-cool text-ink-soft";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2" role="tablist">
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
```

- [ ] **Step 3: Write the page (server component, loads dict)**

```tsx
// app/[locale]/install/page.tsx
import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/lib/i18n";
import { InstallGuide } from "@/components/pwa/InstallGuide";

export default async function InstallPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const t = dict.install;

  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-2xl font-bold text-ink">{t.title}</h1>
      <p className="mt-3 text-ink-soft">{t.intro}</p>
      <div className="mt-8">
        <InstallGuide
          strings={{
            iphoneHeading: t.iphoneHeading,
            iphoneSteps: t.iphoneSteps,
            androidHeading: t.androidHeading,
            androidSteps: t.androidSteps,
            iphoneTab: t.iphoneTab,
            androidTab: t.androidTab,
            openInBrowserNote: t.openInBrowserNote,
          }}
        />
      </div>
    </div>
  );
}
```

NOTE during execution: confirm `dict.install` is typed. If `getDictionary`
returns a type inferred from `messages/en.json`, adding the `install` block is
enough. If there is an explicit `Dictionary` type, add the `install` shape there.

- [ ] **Step 4: Write the render test**

```tsx
// tests/pwa/install-guide.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { InstallGuide } from "@/components/pwa/InstallGuide";

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

  it("renders three numbered steps for the active platform", () => {
    render(<InstallGuide strings={strings} />);
    // Default platform in jsdom (no iOS UA) is Android.
    expect(screen.getByText("Install app")).toBeTruthy();
  });
});
```

- [ ] **Step 5: Run tests**

Run: `npm test -- install-guide`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add app/[locale]/install components/pwa/InstallGuide.tsx tests/pwa/install-guide.test.tsx messages/en.json messages/ar.json
git commit -m "feat(pwa): install help page with iPhone + Android steps"
```

---

## Task 6: Verify end-to-end, then document

- [ ] **Step 1: Full unit suite green**

Run: `npm test`
Expected: all prior 18 tests + the 4 new ones PASS.

- [ ] **Step 2: Production build + start, drive in the browser**

Run: `npm run build` then start it (`npm start`). With the Playwright tools:
- Navigate to `/en/install` — confirm the guide renders, tabs switch.
- Fetch `/manifest.webmanifest` — confirm JSON has name, icons, `display: standalone`.
- Confirm `/sw.js`, `/offline.html`, `/icons/icon-192.png`, `/icons/icon-512.png`, `/icons/icon-maskable-512.png`, `/apple-icon.png` all return 200.
- Evaluate in the page: `navigator.serviceWorker.getRegistration()` resolves (prod build).
- Screenshot the install page and the manifest for the founder.

- [ ] **Step 3: PHI cache check**

In the browser console on a portal page, evaluate:
`caches.open('cgc-static-v2').then(c => c.keys()).then(k => k.map(r => r.url))`
Confirm the list contains ONLY `/offline.html`, `/icons/*`, and `/_next/static/*`
— no portal HTML, no summary, no Supabase URL, no wound photo.

- [ ] **Step 4: Integration tests still green (run alone)**

Run: `npm run test:rls`
Expected: 57 tests PASS. (Run sequentially; never alongside any DB-cleanup script.)

- [ ] **Step 5: Update HANDOFF.md**

Add a new dated banner at the top of `HANDOFF.md` summarizing: PWA shipped
(installable manifest, designed icon, static-only service worker, Apple meta,
`/install` help page), the PHI cache guarantee, how to install on each phone,
and updated test counts.

- [ ] **Step 6: Final commit**

```bash
git add HANDOFF.md
git commit -m "docs: log nurse mobile app (PWA) shipped"
```

---

## Self-review notes

- **Spec coverage:** manifest (T1), designed icon w/ approval-by-review (T2),
  minimal static-only SW + offline page (T3), Apple meta + theme color (T4),
  install help page for both phones (T5), verification incl. PHI cache check +
  HANDOFF (T6). All spec scope items covered.
- **Non-goals respected:** no offline editing, no push, no app store, no PHI in
  cache (enforced by the SW allowlist + verified in T6 S3), no portal redesign.
- **Type consistency:** cache name `cgc-static-v2` used identically in `public/sw.js`
  and the T6 cache check. `InstallGuide`'s `Strings` shape matches the keys passed
  by the page and asserted in the test.
