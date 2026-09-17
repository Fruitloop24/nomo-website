# NoMo Junk — CLAUDE.md

## What it is
TEMPLATE, retired in place — archive, don't fix. Fleet home: `~/cerul-ops/templates/nomo.md`.
Astro static PWA: booking funnel (`/public/book/*`) + dumpster store-reserve funnel
(`/public/reserve/*` → Stripe). Tenant is inactive, so both funnels return "unknown source_site" —
expected, not a bug. Kept as the reference for time-based rentals and as the fork donor for two
client sites.

## Critical rules
- Don't chase the "unknown source_site" errors — the tenant is intentionally inactive.
- PWA is deliberately disabled (`src/pwa.ts` unregisters/clears it; `astro.config.ts` builds a
  `selfDestroying` service worker). Only re-enable for a real launch.
- `.npmrc` sets `legacy-peer-deps=true` — required, `@vite-pwa/astro` peer range doesn't match
  Astro 6.
- `rental_days` is inclusive on both ends (drop day counts), 2-day minimum.
- Dumpster units only reserve on the paid `/reserve/stripe` webhook signal, never on form submit.

## Flow
`/estimate` and `/rent` are thin front ends over Cerul's contract — this repo never touches a
Stripe key or computes the real price. `/rent` collects dates → `POST /public/reserve/availability`
→ pick a span → `POST /public/reserve/checkout` → redirect to Stripe → `/thanks`. Booking funnel
mirrors `/public/book/{request,confirm}`.

## File guide
- `src/config.ts` — single source of truth: contact, reviews, rental pricing, `sourceSite`/`website`
- `astro.config.ts` — `SITE`, Preact, sitemap, AstroPWA (selfDestroying), compress, tailwind
- `src/components/DumpsterReserve.tsx` / `BookingForm.tsx` / `Estimator.tsx` — the three islands
- `src/pwa.ts` — service worker kill switch

## Commands
```bash
npm install   # legacy-peer-deps set in .npmrc
npm run dev
npm run build
npm run preview
```

## Deploy
CF Pages `nomo-website.pages.dev`, branch `main`, `npm run build`. No worker, no bindings.

## References
- Fleet doc / fork recipe: `~/cerul-ops/templates/nomo.md`
- README.md (this repo) for the two-line summary
