# NoMo Junk

TEMPLATE, retired in place. Astro static PWA combining a junk-removal booking funnel
(`/public/book/*`) with a dumpster store-reserve funnel (`/public/reserve/*` → Stripe). Tenant is
inactive; kept as the reference for time-based rentals and as the fork donor for client sites.

## Fork recipe
- Swap `SITE` in `astro.config.ts` and `sourceSite` / `website` in `src/config.ts`
- Replace photos in `public/photos/`
- Provision the tenant (see fleet doc)
- Strip the stale Workbox service worker (`src/pwa.ts` / `astro.config.ts` PWA block) on the fork

## Commands
```bash
npm install   # legacy-peer-deps set in .npmrc
npm run build
```
Deploy: CF Pages `nomo-website.pages.dev`, branch `main`, no worker, no bindings.

See `CLAUDE.md` for critical rules and file guide. Fleet doc: `~/cerul-ops/templates/nomo.md`.
