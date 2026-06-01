# Nurse Mobile App (PWA) — Design Spec

**Date:** 2026-06-01
**Status:** Approved direction, ready for implementation plan
**Author:** Claude + founder (brainstorm session)

## Goal

Let nurses install the existing portal on their phone as a home-screen app, so
they can document visits (vitals, notes, wound photos) the same way they do on
the website today. No new documentation features — only a new way to *launch*
the portal: a home-screen icon that opens full-screen like a native app.

## Why a PWA (not a native app)

A **PWA** (Progressive Web App) is the existing website plus a small set of
files that let a phone "install" it to the home screen. A **native app** would
be a separate iPhone/Android codebase distributed through the app stores.

We chose the PWA after comparing both:

- **Solo non-coder founder.** A native app means maintaining a second/third
  codebase forever. The PWA is the portal already maintained.
- **No offline need.** Connectivity is reliable during visits (founder
  confirmed), removing the main reason to go native.
- **Camera already works.** The wound-photo upload is a standard file input,
  which already opens the camera on phones.
- **Instant updates.** Deploy to Vercel → every nurse has it next launch. No
  app-store review, no forced re-downloads.
- **$0** and a few days, versus app-store fees and weeks of work.

The one real native advantage — rock-solid iPhone push notifications + offline
editing — is not needed for this workflow.

## Decisions captured from the brainstorm

| Question | Decision |
|---|---|
| Connectivity during visits | Usually fine → **online-only**, no offline editing/sync |
| Nurse phones | **Mix of iPhone + Android** → support both |
| In-app "install" nudge banner | **No** → founder trains nurses; ship a standalone help page instead |
| App name | **Caregivers Collective** (short label: **Caregivers**) |
| Opening screen | English nurse portal (`/en/portal`); Arabic deferred |

## Scope — the 5 pieces we add

1. **App manifest** — generated via Next.js 16's `app/manifest.ts`. Declares
   name, short name, icons, `theme_color`, `background_color`,
   `display: "standalone"` (full-screen, no address bar), `orientation:
   "portrait"`, and `start_url: "/en/portal"`. Brand palette:
   `theme_color` teal-deep `#1a504f`, `background_color` paper `#f7f7f3`.

2. **App icon** — *designed*, since no logo image exists today (the brand is a
   text wordmark). A simple monogram/mark in the brand palette (teal/ink on
   paper, or reverse). Exported at the required sizes: 192×192 and 512×512
   (standard), a 512×512 **maskable** variant for Android's adaptive icon, and
   a 180×180 **apple-touch-icon** for iPhone. **The icon design is shown to the
   founder for approval before it is locked** (the one genuinely visual step).

3. **Minimal service worker** — a short, hand-written script (~30 lines, no
   third-party PWA library) whose only jobs are (a) satisfy Android's
   installability requirement and (b) make launch instant. **PHI constraint:**
   it caches **only** static, non-sensitive assets (logo/icon, fonts, an
   offline fallback page). It uses **network-only** for all navigations and data
   and **never** caches portal HTML, summaries, wound photos, or any Supabase
   response. Kept short and dependency-free specifically so it is auditable —
   anyone can read it and confirm no patient data is cached. Registered from a
   small client component.

4. **iPhone polish** — `appleWebApp` metadata (title, `statusBarStyle`) plus
   `theme-color` so iPhone also opens full-screen with the correct status bar
   and icon. (iPhone's "Add to Home Screen" needs no service worker; it relies
   on the manifest + apple-touch-icon + these meta tags.)

5. **Install help page** — a standalone page (e.g. `/[locale]/install`) the
   founder can open *on the nurse's own phone* during training. It detects
   iPhone vs Android (user-agent) and shows the right 3 steps with simple
   visuals. No nagging banner anywhere else in the app.

## Non-goals (explicit YAGNI)

- ❌ Offline editing / background sync — connectivity is fine.
- ❌ Push notifications — unreliable for iOS PWAs, not needed.
- ❌ Caching any patient data / PHI — intentionally excluded.
- ❌ App Store / Google Play presence — avoids fees + review.
- ❌ New portal features, redesign, or new screens — same app exactly.
- ❌ In-app install nudge banner — founder trains nurses directly.

## Security / PHI

Because the PWA *is* the existing portal, it inherits all current protections
unchanged: invite-only magic-link login, Row-Level Security on every
patient-touching table, and signed URLs for wound photos. No new path to
patient data is introduced. The only new component capable of storing anything
locally — the service worker — is restricted by design to non-patient static
assets, keeping PHI out of the device cache.

## Technical notes

- **Stack:** Next.js 16 (App Router), React 19, Tailwind v4, Vercel hosting.
- **Manifest:** use the framework's `app/manifest.ts` route (typed
  `MetadataRoute.Manifest`) rather than a hand-placed `.webmanifest`.
- **Service worker file:** served from the site root (`public/sw.js`) so its
  scope covers the whole app; registered client-side after load.
- **Installability checklist (Android/Chrome):** HTTPS (Vercel ✓), valid
  manifest with name + 192 + 512 icons, registered service worker with a fetch
  handler. **iPhone/Safari:** manifest + apple-touch-icon + `appleWebApp` meta;
  install is via Share → Add to Home Screen.
- **Locale:** `start_url` is the English nurse portal; the install page is
  locale-aware like the rest of the app.

## How we'll verify it works

1. Production build passes (`npm run build`).
2. Lighthouse / Chrome DevTools "Application" tab: manifest valid, app
   installable, icons resolve, opens in `standalone`.
3. Install on a **real Android and a real iPhone** (drive + screenshot via
   Playwright where possible; founder confirms on a physical device): icon
   appears, launches full-screen, login works, document a test visit, capture a
   wound photo from the camera.
4. Inspect Cache Storage on-device and confirm **no portal HTML or patient data
   is cached** — only static assets.
5. Existing tests stay green (`npm test`, `npm run test:rls` — run sequentially,
   never alongside DB-cleanup scripts).

## Open items to resolve during the plan/build

- **Icon design** — produce 2–3 monogram/mark options in the brand palette;
  founder picks one before export.
- **Offline fallback page copy** — short friendly "No connection — reconnect to
  document a visit" message (PHI-free, English; Arabic optional later).
- Confirm `start_url` should be `/en/portal` (vs `/en`); current choice opens
  straight into the nurse's work.
