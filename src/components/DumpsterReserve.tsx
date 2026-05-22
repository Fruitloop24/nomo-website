import { useState } from 'preact/hooks'
import { CONFIG } from '../config'

const RENTAL = CONFIG.rental
const API = CONFIG.bookingApi
const AVAILABILITY_URL = `${API.base}${API.reserveAvailabilityPath}`
const CHECKOUT_URL = `${API.base}${API.reserveCheckoutPath}`

// Cerul enforces a 2-day minimum; we default the pick-up to drop + 2.
const MIN_DAYS = 2

type Step = 'info' | 'dates' | 'handoff' | 'redirecting'

interface Info {
  name: string
  phone: string
  email: string
  address: string // drop-off address (where the can goes — not billing)
  dropOff: string // YYYY-MM-DD
  pickUp: string // YYYY-MM-DD
}

// A drop→pickup span Cerul offers back. Designation (A/B/C) is internal to Cerul.
interface OpenDate {
  drop_date: string // YYYY-MM-DD
  pickup_date: string // YYYY-MM-DD
  display_label: string // "Tue May 27 → Fri May 30"
}

const pad = (n: number) => String(n).padStart(2, '0')
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
function todayISO(): string { return iso(new Date()) }
function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return iso(d)
}
// Whole calendar days in the span. Cerul's contract: pickup_date = drop_date + rental_days.
function daysBetween(a: string, b: string): number {
  if (!a || !b) return 0
  const ms = new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime()
  return Math.max(0, Math.round(ms / 86_400_000))
}
// On-page estimate only — Cerul computes the real charge (+ tax) at checkout.
function estimate(rentalDays: number): number {
  return RENTAL.basePrice + Math.max(0, rentalDays - RENTAL.includedDays) * RENTAL.perExtraDay
}
const money = (n: number) => `$${n.toLocaleString()}`

export default function DumpsterReserve() {
  const [step, setStep] = useState<Step>('info')
  const [info, setInfo] = useState<Info>({
    name: '', phone: '', email: '', address: '', dropOff: '', pickUp: '',
  })
  const [dates, setDates] = useState<OpenDate[]>([])
  const [excludeDates, setExcludeDates] = useState<string[]>([])
  const [handoff, setHandoff] = useState({ message: '', phone: CONFIG.phone.display })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const rentalDays = daysBetween(info.dropOff, info.pickUp)
  const extraDays = Math.max(0, rentalDays - RENTAL.includedDays)
  const est = estimate(Math.max(rentalDays, MIN_DAYS))

  // Picking a drop-off date defaults the pick-up to drop + 2 (the minimum).
  function setDropOff(e: Event) {
    const dropOff = (e.target as HTMLInputElement).value
    const minPick = addDays(dropOff, MIN_DAYS)
    const pickUp = !info.pickUp || info.pickUp < minPick ? minPick : info.pickUp
    setInfo({ ...info, dropOff, pickUp })
  }
  const update = (k: keyof Info) => (e: Event) =>
    setInfo({ ...info, [k]: (e.target as HTMLInputElement).value })

  function showHandoff(message?: string, phone?: string) {
    setHandoff({
      message: message || "We've got your info — we'll text you the next open drop-off date within 24 hours.",
      phone: phone || CONFIG.phone.display,
    })
    setStep('handoff')
  }

  // Call 1 — open dates. Only the date + length goes to Cerul here, no PII.
  async function requestDates(exclude: string[]) {
    const res = await fetch(AVAILABILITY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source_site: API.sourceSite,
        preferred_drop_date: info.dropOff,
        rental_days: rentalDays,
        exclude_dates: exclude,
      }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data?.error || "We couldn't check availability. Please try again or call us.")
    }
    return res.json() as Promise<{
      dates?: OpenDate[]; handoff?: boolean; handoff_message?: string; phone?: string
    }>
  }

  async function submitInfo(e: Event) {
    e.preventDefault()
    setError('')
    if (!info.name.trim()) return setError('Please enter your name.')
    if (!info.phone.trim()) return setError('Please enter a phone number so we can confirm.')
    if (!info.email.trim()) return setError('Please enter an email for your receipt.')
    if (!info.address.trim()) return setError('Please enter the drop-off address.')
    if (!info.dropOff) return setError('Please pick a drop-off date.')
    if (rentalDays < MIN_DAYS) return setError(`Pick-up must be at least ${MIN_DAYS} days after drop-off.`)

    setLoading(true)
    setExcludeDates([])
    try {
      const data = await requestDates([])
      if (data.handoff) return showHandoff(data.handoff_message, data.phone)
      setDates(data.dates || [])
      setStep('dates')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function noneWork() {
    setError('')
    setNotice('')
    setLoading(true)
    const next = [...excludeDates, ...dates.map((d) => d.drop_date)]
    setExcludeDates(next)
    try {
      const data = await requestDates(next)
      if (data.handoff) return showHandoff(data.handoff_message, data.phone)
      setDates(data.dates || [])
      setNotice('Here are the next open drop-off days.')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  // Call 2 — customer picked a span → Cerul mints the Stripe session, we redirect.
  async function reserve(d: OpenDate) {
    setError('')
    setLoading(true)
    setStep('redirecting')
    try {
      const origin = window.location.origin
      const res = await fetch(CHECKOUT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_site: API.sourceSite,
          drop_date: d.drop_date,
          rental_days: daysBetween(d.drop_date, d.pickup_date),
          drop_address: info.address,
          name: info.name,
          phone: info.phone,
          email: info.email,
          success_url: `${origin}/thanks?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${origin}/rent`,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data?.checkout_url) {
        window.location.href = data.checkout_url
        return
      }
      // Race: that span filled between Call 1 and Call 2 — re-render fresh dates.
      if (data?.reason === 'date_taken' && Array.isArray(data?.dates)) {
        setDates(data.dates)
        setNotice('That day just got taken — here are fresh openings.')
        setStep('dates')
        return
      }
      throw new Error(data?.error || "We couldn't start checkout. Please try again or call us.")
    } catch (err) {
      setError((err as Error).message)
      setStep('dates')
    } finally {
      setLoading(false)
    }
  }

  // ─── Redirecting to Stripe ─────────────────────────────────────────────
  if (step === 'redirecting') {
    return (
      <div class="bg-white rounded-2xl border border-warm-100 p-8 md:p-10 shadow-sm text-center">
        <svg class="animate-spin h-8 w-8 text-accent mx-auto mb-4" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p class="text-stone-600">Taking you to secure checkout…</p>
      </div>
    )
  }

  // ─── Handoff (no open dates → call) ────────────────────────────────────
  if (step === 'handoff') {
    return (
      <div class="bg-white rounded-2xl border border-warm-100 p-8 md:p-10 shadow-sm text-center">
        <div class="w-14 h-14 bg-warm-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg class="w-7 h-7 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
          </svg>
        </div>
        <h2 class="font-heading text-2xl md:text-3xl font-bold text-stone-900 mb-2">
          We got your info, {info.name.split(' ')[0]}.
        </h2>
        <p class="text-stone-600 mb-6">{handoff.message}</p>
        <p class="text-stone-500 text-sm mb-6">
          Want to lock a date now? Call us at{' '}
          <a href={CONFIG.phone.href} class="text-accent hover:text-accent-dark font-semibold no-underline">{handoff.phone}</a>.
        </p>
        <a href="/" class="inline-block text-accent hover:text-accent-dark font-semibold text-sm no-underline">← Back to home</a>
      </div>
    )
  }

  // ─── Date picker (step 2) ──────────────────────────────────────────────
  if (step === 'dates') {
    return (
      <div class="bg-white rounded-2xl border border-warm-100 p-6 md:p-8 shadow-sm">
        <div class="mb-5">
          <p class="text-accent text-xs font-semibold tracking-widest uppercase mb-1">Step 2 of 2</p>
          <h2 class="font-heading text-xl md:text-2xl font-bold text-stone-900">Pick a drop-off day, {info.name.split(' ')[0]}</h2>
          <p class="text-stone-500 text-sm mt-1">{rentalDays}-day rental. Tap a date to reserve &amp; pay — final total (plus tax) shown at checkout.</p>
        </div>

        {notice && <div class="bg-warm-50 border border-warm-200 text-warm-800 rounded-lg p-3 text-sm mb-4">{notice}</div>}

        {dates.length === 0 ? (
          <div class="text-center py-8">
            <p class="text-stone-600 mb-4">No open drop-off days came back near that date.</p>
            <button onClick={() => setStep('info')} class="text-accent hover:text-accent-dark font-semibold text-sm bg-transparent border-0 cursor-pointer">← Try a different date</button>
          </div>
        ) : (
          <div class="space-y-2 mb-6">
            {dates.map((d) => (
              <button
                key={d.drop_date}
                onClick={() => reserve(d)}
                disabled={loading}
                class="w-full px-5 py-4 bg-warm-50 hover:bg-accent hover:text-white text-stone-700 text-left font-semibold rounded-xl border border-warm-200 hover:border-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-between"
              >
                <span>{d.display_label}</span>
                <span class="text-sm font-bold" aria-hidden="true">→</span>
              </button>
            ))}
          </div>
        )}

        {error && <div class="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">{error}</div>}

        <div class="flex flex-col sm:flex-row gap-3 pt-4 border-t border-warm-100">
          <button onClick={() => { setStep('info'); setError(''); setNotice(''); setExcludeDates([]) }} disabled={loading}
            class="text-sm text-stone-500 hover:text-stone-700 font-medium bg-transparent border-0 cursor-pointer disabled:opacity-50 text-left">
            ← Change dates or info
          </button>
          <button onClick={noneWork} disabled={loading}
            class="sm:ml-auto text-sm text-accent hover:text-accent-dark font-semibold bg-transparent border-0 cursor-pointer disabled:opacity-50 text-left sm:text-right">
            {loading ? 'Loading…' : 'None of these work → see other days'}
          </button>
        </div>
      </div>
    )
  }

  // ─── Info + dates (step 1) ─────────────────────────────────────────────
  return (
    <form onSubmit={submitInfo} class="bg-white rounded-2xl border border-warm-100 p-6 md:p-8 shadow-sm space-y-5">
      <div class="mb-1">
        <p class="text-accent text-xs font-semibold tracking-widest uppercase mb-1">Step 1 of 2</p>
        <h2 class="font-heading text-xl md:text-2xl font-bold text-stone-900">Reserve your dumpster</h2>
      </div>

      <div>
        <label for="name" class="block text-sm font-semibold text-stone-700 mb-1.5">Your name <span class="text-accent">*</span></label>
        <input id="name" type="text" required value={info.name} onInput={update('name')}
          class="w-full px-4 py-2.5 border border-warm-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent bg-white" />
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label for="phone" class="block text-sm font-semibold text-stone-700 mb-1.5">Phone <span class="text-accent">*</span></label>
          <input id="phone" type="tel" required value={info.phone} onInput={update('phone')} placeholder="(000) 000-0000"
            class="w-full px-4 py-2.5 border border-warm-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent bg-white" />
        </div>
        <div>
          <label for="email" class="block text-sm font-semibold text-stone-700 mb-1.5">Email <span class="text-accent">*</span></label>
          <input id="email" type="email" required value={info.email} onInput={update('email')} placeholder="you@example.com"
            class="w-full px-4 py-2.5 border border-warm-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent bg-white" />
        </div>
      </div>

      <div>
        <label for="address" class="block text-sm font-semibold text-stone-700 mb-1.5">Drop-off address <span class="text-accent">*</span></label>
        <input id="address" type="text" required value={info.address} onInput={update('address')} placeholder="123 Main St, Macon, GA"
          class="w-full px-4 py-2.5 border border-warm-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent bg-white" />
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label for="dropoff" class="block text-sm font-semibold text-stone-700 mb-1.5">Drop-off date <span class="text-accent">*</span></label>
          <input id="dropoff" type="date" required value={info.dropOff} onInput={setDropOff} min={todayISO()}
            class="w-full px-4 py-2.5 border border-warm-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent bg-white" />
        </div>
        <div>
          <label for="pickup" class="block text-sm font-semibold text-stone-700 mb-1.5">Pick-up date <span class="text-accent">*</span></label>
          <input id="pickup" type="date" required value={info.pickUp} onInput={update('pickUp')} min={info.dropOff ? addDays(info.dropOff, MIN_DAYS) : todayISO()}
            class="w-full px-4 py-2.5 border border-warm-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent bg-white" />
          <p class="text-xs text-stone-500 mt-1">{MIN_DAYS}-day minimum.</p>
        </div>
      </div>

      {/* Estimate — Cerul computes the real charge (+ tax) at checkout */}
      <div class="flex items-center justify-between bg-warm-50 border border-warm-200 rounded-xl px-5 py-4">
        <div>
          <div class="text-xs uppercase tracking-widest text-stone-500 font-semibold">Estimate</div>
          <div class="text-xs text-stone-500">
            {rentalDays > 0 ? `${rentalDays}-day rental · ` : ''}first ton included{extraDays > 0 ? ` · +${extraDays} day${extraDays > 1 ? 's' : ''} @ ${money(RENTAL.perExtraDay)}` : ''} · plus tax
          </div>
        </div>
        <div class="text-right">
          <div class="font-heading text-3xl font-bold text-accent">{money(est)}</div>
          <div class="text-[11px] text-stone-400">+ tax · final at checkout</div>
        </div>
      </div>

      {error && <div class="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>}

      <button type="submit" disabled={loading}
        class="w-full bg-accent hover:bg-accent-dark text-white px-6 py-3.5 rounded-xl font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2">
        {loading ? (
          <>
            <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Checking availability…
          </>
        ) : (
          <>Check available dates <span aria-hidden="true">→</span></>
        )}
      </button>

      <p class="text-xs text-stone-500 text-center">Secure checkout via Stripe. You won't be charged until you pick a confirmed date.</p>
    </form>
  )
}
