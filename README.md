# NoMo Junk

Marketing site + booking + estimator + dumpster-reservation funnel for **NoMo Junk**
(Middle Georgia — junk removal & roll-off dumpster rentals).

Cloned from the `flooring-gallery` Astro template, AI stripped out, recolored **black + electric
blue** to match the logo. Shares the booking backend (`hetzner.cerul.org`), tagged
`source_site: 'nomojunkga.com'`.

- **Domain:** nomojunkga.com
- **Facebook:** <https://www.facebook.com/NoMoJunkMiddleGa>
- **Phone:** (478) 285-9915 · **Email:** nomojunk89@gmail.com
- **Address:** 724 5th Ave, Eastman, GA 31023

---

## Status — 2026-05-24

**Done & verified in-browser:**
- Astro 6 + Tailwind 4 + Preact islands. Bold **blue-on-black** theme; sections alternate solid
  electric-blue / black so nothing reads as a "black hole."
- **Real content wired** (`src/config.ts`): phone, email, address, domain, 11 areas served,
  6 real Facebook reviews + `25+ five-star` badge (with `AggregateRating`/`Review` JSON-LD).
- **Real photos** in `public/photos/` — `dumpster-main` (branded trailer), `colby-profile`,
  before/after pairs (garage/field/barn), and Home/Commercial/Impossible category tiles.
- **Homepage:** hero → "What We Do" photo tiles → estimate CTA → single-dumpster feature →
  **auto-rotating Before/After carousel** (3s, dots) → testimonials (white cards on blue) →
  FAQ → final CTA.
- **Inner pages** all lead with a photo + a slim blue strip (estimate / rent / book / about).
- **Facebook** link in the header nav strip **and** footer (driven from `CONFIG.socials`).
- **Estimator** (`/estimate`): junk-haul + dumpster tab. Dumpster tab = the one real
  **7×16×4 @ $425**.
- **Dumpster reservation** (`/rent`): one size (7×16×4), date-driven. **Frontend is built and
  verified** — see below. Backend endpoints + Stripe are the remaining work.

**Not done (tomorrow):** the reservation/booking **backend framework** + an end-to-end test
that we can actually book. See "Pick Up Tomorrow."

---

## The dumpster reservation flow (`/rent`)

One dumpster size, a **fleet of 3 identical units (A/B/C)** rented **by date**. The site is a
**thin front end over Cerul's "store-reserve" contract** — we collect info and figure out a date,
**Cerul owns the price, the Stripe checkout, and the booking.** We never touch a Stripe key.

- **Pricing is informational only.** The `/rent` page + the island estimate are drawn from
  `CONFIG.rental` (base **$425** = drop-off + pickup + first ton + **2 days**; **+$100/day** after;
  **plus tax**). The real charge is computed by Cerul at checkout — the estimate is labeled
  "+ tax · final at checkout" so it can't be mistaken for the total.
- **Flow** (`DumpsterReserve.tsx`, mirrors the junk booking flow):
  1. Island collects name / phone / email / **drop-off address** / drop-off date / pick-up date.
     **Pick-up = the last day the customer keeps the can (inclusive), not the return day** — so
     `rental_days = daysBetween(drop, pickUp) + 1`. Drop 25 → pick-up 29 keeps it 25-29 = **5
     days**. **2-day minimum** (drop + the next day); pick-up defaults to drop + 1. Cerul books the
     span as `drop → pickup + 1` internally, so the on-page day count matches what the customer
     intuitively "has the dumpster for." Form state is held client-side and resent — no server-side
     lead.
  2. `POST {base}/public/reserve/availability` `{ source_site, preferred_drop_date, rental_days,
     exclude_dates }` → up to 3 open `{ drop_date, pickup_date, display_label }` spans, or
     `{ handoff: true, handoff_message, phone }`.
  3. Pick a span → `POST {base}/public/reserve/checkout` `{ source_site, drop_date, rental_days,
     drop_address, name, phone, email, success_url, cancel_url }` → `{ checkout_url }`; the page
     redirects to Stripe. Race case → `{ ok:false, reason:'date_taken', dates:[…] }` re-renders.
  4. Pay on Stripe → returns to **`/thanks`** (`success_url`); cancel → `/rent`. The booking is
     created on **Cerul's signed webhook** after payment — the site's job ends at the redirect.
  5. "None of these work" twice → handoff screen with the phone number (same as booking).

> Endpoint paths live in `CONFIG.bookingApi` (`reserveAvailabilityPath` / `reserveCheckoutPath`).
> `source_site` = `nomojunkga.com`. Build is clean; island hydrates with no console errors.

---

## Pick Up Tomorrow

### 1. Reservation backend — **owned by Cerul** (`~/Documents/cerul/docs/reservation.md`)
The two endpoints (`/public/reserve/availability`, `/public/reserve/checkout`) and the signed
`/reserve/stripe` webhook are **Cerul's** to build — Cerul computes price, mints the Stripe
session, holds the Stripe secret in its `cerul-sct` vault, and creates the `source='reserve'`
calendar event + paid (taxed) invoice on the webhook. **Our front end is done to that contract.**
What Cerul still needs from us / KC:
- **CORS allowlist:** add our origins → `https://nomojunkga.com`, `https://www.nomojunkga.com`,
  the Cloudflare Pages preview suffix (`*.<project>.pages.dev` once the Pages project exists), and
  `http://localhost:4321` for dev. Until then the calls are blocked.
- **`source_site` mapping:** map `nomojunkga.com` → the dumpster tenant + its `store_reserve`
  config block (inventory A/B/C, pricing, `tax_rate`, handoff name/phone).
- **Reminders:** Cerul's existing 24h/1h customer-email cron fires for any event with a
  `customer_email`, so dumpster reminders come along for free once the webhook writes the event —
  ask Cerul to use rental-worded copy ("your dumpster arrives tomorrow") for `source='reserve'`.

### 2. Test the booking flow end-to-end
Confirm `/book` actually talks to `hetzner.cerul.org/public/book/{request,confirm}` for
`source_site: 'nomojunkga.com'` — returns real slots, books one, and the handoff fires after
6 excluded slots. Make sure Hetzner **recognizes `nomojunkga.com`** and routes notifications to
the right operator.

### 3. Confirm pricing with Colby
`CONFIG.rental`: `basePrice` 425 · `includedDays` 2 · `includedTons` 1 · `perExtraDay` 100.
Change in one place if any of those are off.

### 4. Re-enable PWA before launch
Service worker is **deliberately disabled** right now (it was serving stale builds during dev):
`pwa.ts` unregisters/clears it and `astro.config.ts` builds a `selfDestroying` SW. To turn it back
on: restore `registerSW()` in `src/pwa.ts` and remove `selfDestroying: true` in `astro.config.ts`.

### 5. Deploy
`astro build` → static `dist/` → Cloudflare Pages on **nomojunkga.com**. Update `SITE` in
`astro.config.ts` if the domain changes.

### 6. Optional polish
More before/after pairs or reviews drop straight into `CONFIG.images.beforeAfters` /
`CONFIG.testimonials`.

---

## Run It

```bash
cd /home/mini/Documents/nomo
npm install           # legacy-peer-deps is set in .npmrc (works around @vite-pwa/astro peer range)
npm run dev           # http://localhost:4321  (dev mode has NO service worker — always fresh)
npm run build         # outputs dist/
npm run preview       # serve the production build locally
```

---

## File Layout

```
src/
  config.ts                       # Single source of truth — contact, reviews, rental, pricing, nav
  layouts/Base.astro              # SEO, OG, manifest, Header + slot + Footer + MobileNav
  components/
    Header.astro                  # blue bar: phone · logo · Book + nav strip (incl. Facebook icon)
    Footer.astro                  # logo, "Follow us on Facebook", links, contact, areas-served chips
    MobileNav.astro               # bottom bar: Home / Rent / About / Call
    FAQ.astro                     # CONFIG.faqs[] with FAQPage JSON-LD
    SchemaLocalBusiness.astro     # MovingCompany JSON-LD + AggregateRating + Reviews
    Testimonials.astro            # blue section, white review cards (CONFIG.testimonials)
    BeforeAfterCarousel.astro     # auto-rotating (3s) before|after carousel with dots
    BookingForm.tsx               # Preact island — 2-step junk booking → hetzner /public/book/*
    DumpsterReserve.tsx           # Preact island — dumpster reservation → /public/rent/* → Stripe
    Estimator.tsx                 # Preact island — junk haul + dumpster (single 7×16×4) tabs
  pages/
    index.astro                   # Home: hero → what-we-do tiles → estimate → dumpster → carousel → reviews → FAQ → CTA
    estimate.astro                # Photo header + <Estimator client:load />
    rent.astro                    # Photo header + dumpster spec/price/rules + <DumpsterReserve client:load />
    book.astro                    # Photo header + <BookingForm client:load />
    about.astro                   # Photo header + Colby photo + story
  styles/global.css               # Tailwind + @theme (black/blue palette, Oswald) + .card-electric / glow utils
  pwa.ts                          # Service-worker DISABLED (unregisters + clears caches) — see #4 above
public/
  logo.jpg, favicon.svg
  photos/                         # dumpster-main, colby-profile, before/after pairs, category tiles
astro.config.ts                   # site=nomojunkga.com; preact, sitemap, astro-icon, AstroPWA(selfDestroying), compress, tailwind
```

---

## Architectural Notes

- **Config-driven.** Edit `src/config.ts`, not components — contact, reviews, areas, FAQs, nav,
  estimator pricing, and the dumpster `rental` model all live there.
- **Static output.** `astro build` emits plain `dist/` — Cloudflare Pages, no adapter. (Stripe
  session creation therefore needs a backend; it can't run in the static site.)
- **Interactivity = islands only.** Three Preact islands: `BookingForm`, `DumpsterReserve`,
  `Estimator`. Everything else is static Astro + one vanilla `<script>` for the carousel.
- **Shared backend.** `hetzner.cerul.org` handles both junk booking (`/public/book/*`) and
  dumpster reservation (`/public/rent/*`), distinguished by the `source_site` field.
- **Schema.** `MovingCompany` JSON-LD + real `AggregateRating` (5.0, 25) and `Review` entries →
  eligible for ⭐ rich snippets in Google.
- **`legacy-peer-deps=true` in `.npmrc`.** `@vite-pwa/astro@1.2.0` declares peer `astro@^5` but
  runs fine on Astro 6.

---

## The Funnel

```
   ┌─── Hero "Get an Estimate" ─→ /estimate ─┐
   │                                          ├─→ /book or call ─→ Job on calendar
   └─── "Rent a Dumpster" ─→ /rent ──────────┘        (or Stripe-paid reservation, auto-booked)
```

Estimator prices sit above national typical so "we can usually beat it" stays honest — don't tune
below that line or the pitch breaks.
