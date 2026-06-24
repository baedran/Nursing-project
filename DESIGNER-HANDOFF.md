# Caregivers Collective — Designer Handoff

A marketing website for a home-nursing service in **Beirut & Mount Lebanon**.
It's a brochure/lead-gen site: every call-to-action funnels to **WhatsApp**, and
pricing is **quote-only** (no prices published). There is **no backend, no
database, no login, no accounts** — it's a static marketing site plus WhatsApp links.

> **Heads up:** an older version of this project had a patient "portal" (logins,
> nurse/family dashboards, a database). That has been **removed**. It's preserved
> on a git branch called `mothball/portal` — **ignore it.** The old `HANDOFF.md`
> in this folder describes that dead portal; **this file is the current truth.**

---

## Tech stack

| Layer | Tech |
|---|---|
| Framework | **Next.js 16** (App Router) + **React 19** |
| Styling | **Tailwind CSS v4** (theme tokens in `app/globals.css`) |
| Language | **TypeScript** |
| Fonts | Fontshare (Switzer, Cabinet Grotesk, Fragment Mono) — loaded in `app/[locale]/layout.tsx` |
| i18n | Custom — English (`en`) + Arabic (`ar`, placeholder); strings in `messages/*.json` |
| Hosting | **Vercel** — auto-deploys when `master` is pushed to GitHub |

**No environment variables or secrets are needed to run or build this site.**
(`.env.local` / `.supabase-token` are leftovers from the old portal, are
git-ignored, and can be ignored or deleted.)

---

## Run it locally

```bash
npm install        # first time only
npm run dev        # starts the dev server (hot-reloads on save)
# open http://localhost:3000/en
```

```bash
npm run build      # production build — run this before pushing to catch errors
```

Requires Node.js 18+.

---

## Where everything lives (the map)

| You want to change… | Edit this |
|---|---|
| **All English text/copy** | `messages/en.json` |
| Arabic text (placeholder — needs a real pass) | `messages/ar.json` |
| **Brand name, WhatsApp number, service area, locales** | `lib/site.ts` (single source of truth) |
| **Colors / palette / spacing tokens** | `app/globals.css` (the `@theme` block) |
| **Fonts** | `app/[locale]/layout.tsx` (the Fontshare `<link>`) |
| **Hero & section photos** | `photoUrl` fields in `messages/en.json`, and `HERO_PHOTO` constants at the top of each `app/[locale]/<page>/page.tsx` |
| **Page section order / structure** | the page file: `app/[locale]/page.tsx` (home) or `app/[locale]/<page>/page.tsx` |
| **A specific section's design** | `components/home/<SectionName>.tsx` |
| **Top nav** | `components/Topbar.tsx` + `components/MobileNav.tsx` |
| **Footer** | `components/Footer.tsx` |
| **The WhatsApp button** | `components/WhatsAppButton.tsx` |

### The 8 pages
`/` (home), `/services`, `/packages`, `/how-we-work`, `/diaspora`
(for families abroad), `/faq`, `/for-nurses`, `/contact` — each at
`app/[locale]/<name>/page.tsx`. All are prefixed with a locale (`/en/...`,
`/ar/...`); visiting `/` redirects to `/en` (see `proxy.ts`).

---

## What needs design love (known gaps)

1. **Photography** — every image is a stock (Unsplash) placeholder. Replace with
   real, commissioned Beirut photography. This is the single biggest upgrade.
2. **Arabic** — `messages/ar.json` is placeholder/rough and still references some
   removed features. Needs a proper native Arabic pass (the site is RTL-aware).
3. **Mobile / responsive polish** — review every page at phone widths.
4. **Lighthouse + accessibility pass** — run before any real launch.
5. **Real domain** — currently on a `*.vercel.app` URL.

---

## Deploying

The site auto-deploys: **push to the `master` branch on GitHub → Vercel rebuilds
the live site** (~2 min). No manual deploy step. (You can also trigger a redeploy
from the Vercel dashboard.)

---

## Git note

`master` is the live marketing site. `mothball/portal` holds the old portal code
(safe to ignore). Please branch off `master` for changes and open a PR so the
founder can review.
