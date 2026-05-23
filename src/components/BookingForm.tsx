import { useState } from 'preact/hooks'
import { CONFIG } from '../config'

type Step = 'info' | 'slots' | 'confirmed' | 'handoff'
type PreferredWindow = 'morning' | 'afternoon' | 'anytime'

interface CustomerInfo {
  name: string
  phone: string
  email: string
  address: string
  preferredDate: string
  preferredWindow: PreferredWindow
  message: string
}

interface Slot {
  slot_id: string
  starts_at: string
  ends_at: string
  worker_name: string
  display_label: string
}

const API = CONFIG.bookingApi
const REQUEST_URL = `${API.base}${API.requestPath}`
const CONFIRM_URL = `${API.base}${API.confirmPath}`

const WINDOWS: { value: PreferredWindow; label: string }[] = [
  { value: 'morning', label: 'AM' },
  { value: 'afternoon', label: 'PM' },
  { value: 'anytime', label: 'Anytime' },
]

function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Build preferred_start_iso from date + window. Hour encodes the window:
// morning/anytime → 8am, afternoon → 1pm. Visitors are overwhelmingly in ET;
// the server clamps to business hours anyway.
function preferredStartISO(dateStr: string, window: PreferredWindow): string {
  const hour = window === 'afternoon' ? 13 : 8
  const d = new Date(`${dateStr}T${String(hour).padStart(2, '0')}:00:00`)
  return d.toISOString()
}

function customerPayload(info: CustomerInfo) {
  return {
    source_site: API.sourceSite,
    name: info.name,
    phone: info.phone,
    email: info.email,
    address: info.address,
    message: info.message,
  }
}

export default function BookingForm() {
  const [step, setStep] = useState<Step>('info')
  const [info, setInfo] = useState<CustomerInfo>({
    name: '', phone: '', email: '', address: '',
    preferredDate: '', preferredWindow: 'anytime', message: '',
  })
  const [slots, setSlots] = useState<Slot[]>([])
  const [excludeIds, setExcludeIds] = useState<string[]>([])
  const [confirmationMessage, setConfirmationMessage] = useState('')
  const [handoffMessage, setHandoffMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [conflictNotice, setConflictNotice] = useState('')

  const update = (k: keyof CustomerInfo) => (e: Event) =>
    setInfo({ ...info, [k]: (e.target as HTMLInputElement).value })

  // Server side-effect: when /request returns handoff:true (after 6 excluded
  // slots), it already created the 📞 CALL event + fired Web Push on the
  // contractor's dashboard. Frontend just renders the message.
  function handleHandoff(message: string | undefined) {
    setHandoffMessage(message || "We've got your info — someone will reach out within 24 hours.")
    setStep('handoff')
  }

  async function requestSlots(excludeSlotIds: string[]) {
    const res = await fetch(REQUEST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...customerPayload(info),
        preferred_start_iso: preferredStartISO(info.preferredDate, info.preferredWindow),
        exclude_slot_ids: excludeSlotIds,
      }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data?.error || "We couldn't load available times. Please try again or call us.")
    }
    return res.json() as Promise<{
      slots?: Slot[]
      handoff?: boolean
      handoff_message?: string
    }>
  }

  async function submitInfo(e: Event) {
    e.preventDefault()
    setError('')
    if (!info.name.trim()) return setError('Please enter your name.')
    if (!info.phone.trim()) return setError('Please enter a phone number so we can confirm.')
    if (!info.email.trim()) return setError('Please enter an email so we can send a confirmation.')
    if (!info.address.trim()) return setError('Please enter the address where the work will happen.')
    if (!info.preferredDate) return setError('Please pick a preferred date.')

    setLoading(true)
    setExcludeIds([])
    try {
      const data = await requestSlots([])
      if (data.handoff) {
        handleHandoff(data.handoff_message)
        return
      }
      setSlots(data.slots || [])
      setStep('slots')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function bookSlot(slot: Slot) {
    setError('')
    setConflictNotice('')
    setLoading(true)
    try {
      const res = await fetch(CONFIRM_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...customerPayload(info),
          slot_id: slot.slot_id,
        }),
      })

      if (res.status === 201) {
        const data = await res.json().catch(() => ({}))
        setConfirmationMessage(data?.confirmation_message || `Booked for ${slot.display_label}. Confirmation on the way.`)
        setStep('confirmed')
        return
      }

      if (res.status === 409) {
        const data = await res.json().catch(() => ({}))
        const fresh: Slot[] = Array.isArray(data?.new_slots) ? data.new_slots : []
        setSlots(fresh)
        setConflictNotice('Someone just grabbed that one — here are the closest open times.')
        return
      }

      const data = await res.json().catch(() => ({}))
      throw new Error(data?.error || "We couldn't book that time. Please try again or call us.")
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function noneWork() {
    setError('')
    setConflictNotice('')
    setLoading(true)
    const nextExclude = [...excludeIds, ...slots.map((s) => s.slot_id)]
    setExcludeIds(nextExclude)
    try {
      const data = await requestSlots(nextExclude)
      if (data.handoff) {
        handleHandoff(data.handoff_message)
        return
      }
      setSlots(data.slots || [])
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  // ─── Confirmed ─────────────────────────────────────────────────────────
  if (step === 'confirmed') {
    return (
      <div class="bg-white rounded-2xl border border-warm-100 p-8 md:p-10 shadow-sm text-center">
        <div class="w-14 h-14 bg-warm-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg class="w-7 h-7 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h2 class="font-heading text-2xl md:text-3xl font-bold text-stone-900 mb-2">
          You're booked, {info.name.split(' ')[0]}!
        </h2>
        <p class="text-stone-600 mb-6">{confirmationMessage}</p>
        <div class="bg-warm-50 rounded-xl p-5 text-sm text-stone-600 mb-6 text-left">
          <div class="font-semibold text-stone-900 mb-2">What happens next</div>
          <ul class="space-y-1.5">
            <li>&middot; You'll get a confirmation email shortly.</li>
            <li>&middot; We'll come to {info.address} and walk the job.</li>
            <li>&middot; You'll get a straight-up price before we load anything — no pressure, no surprises.</li>
          </ul>
        </div>
        <a href="/" class="inline-block text-accent hover:text-accent-dark font-semibold text-sm no-underline">← Back to home</a>
      </div>
    )
  }

  // ─── Handoff (server bailed us to "someone will call you") ─────────────
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
        <p class="text-stone-600 mb-6">{handoffMessage}</p>
        <p class="text-stone-500 text-sm mb-6">
          Don't want to wait? Call us at{' '}
          <a href={CONFIG.phone.href} class="text-accent hover:text-accent-dark font-semibold no-underline">{CONFIG.phone.display}</a>.
        </p>
        <a href="/" class="inline-block text-accent hover:text-accent-dark font-semibold text-sm no-underline">← Back to home</a>
      </div>
    )
  }

  // ─── Slot picker ───────────────────────────────────────────────────────
  if (step === 'slots') {
    return (
      <div class="bg-white rounded-2xl border border-warm-100 p-6 md:p-8 shadow-sm">
        <div class="mb-5">
          <p class="text-accent text-xs font-semibold tracking-widest uppercase mb-1">Step 2 of 2</p>
          <h2 class="font-heading text-xl md:text-2xl font-bold text-stone-900">Pick a time, {info.name.split(' ')[0]}</h2>
          <p class="text-stone-500 text-sm mt-1">Tap one to lock it in.</p>
        </div>

        {conflictNotice && (
          <div class="bg-warm-50 border border-warm-200 text-warm-800 rounded-lg p-3 text-sm mb-4">
            {conflictNotice}
          </div>
        )}

        {slots.length === 0 ? (
          <div class="text-center py-8">
            <p class="text-stone-600 mb-4">No openings came back for that window.</p>
            <button
              onClick={() => setStep('info')}
              class="text-accent hover:text-accent-dark font-semibold text-sm bg-transparent border-0 cursor-pointer"
            >
              ← Try a different date
            </button>
          </div>
        ) : (
          <div class="space-y-2 mb-6">
            {slots.map((slot) => (
              <button
                key={slot.slot_id}
                onClick={() => bookSlot(slot)}
                disabled={loading}
                class="w-full px-5 py-4 bg-warm-50 hover:bg-accent hover:text-white text-stone-700 text-left font-semibold rounded-xl border border-warm-200 hover:border-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {slot.display_label}
              </button>
            ))}
          </div>
        )}

        {error && (
          <div class="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">
            {error}
          </div>
        )}

        <div class="flex flex-col sm:flex-row gap-3 pt-4 border-t border-warm-100">
          <button
            onClick={() => { setStep('info'); setError(''); setConflictNotice(''); setExcludeIds([]) }}
            disabled={loading}
            class="text-sm text-stone-500 hover:text-stone-700 font-medium bg-transparent border-0 cursor-pointer disabled:opacity-50 text-left"
          >
            ← Change date or info
          </button>
          <button
            onClick={noneWork}
            disabled={loading}
            class="sm:ml-auto text-sm text-accent hover:text-accent-dark font-semibold bg-transparent border-0 cursor-pointer disabled:opacity-50 text-left sm:text-right"
          >
            {loading ? 'Loading…' : 'None of these work → see other times'}
          </button>
        </div>
      </div>
    )
  }

  // ─── Info form (default) ───────────────────────────────────────────────
  return (
    <form
      onSubmit={submitInfo}
      class="bg-white rounded-2xl border border-warm-100 p-6 md:p-8 shadow-sm space-y-5"
    >
      <div class="mb-1">
        <p class="text-accent text-xs font-semibold tracking-widest uppercase mb-1">Step 1 of 2</p>
        <h2 class="font-heading text-xl md:text-2xl font-bold text-stone-900">Tell us about your project</h2>
      </div>

      <div>
        <label for="name" class="block text-sm font-semibold text-stone-700 mb-1.5">Your name <span class="text-accent">*</span></label>
        <input
          id="name" type="text" required value={info.name} onInput={update('name')}
          class="w-full px-4 py-2.5 border border-warm-200 rounded-lg text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent bg-white"
        />
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label for="phone" class="block text-sm font-semibold text-stone-700 mb-1.5">Phone <span class="text-accent">*</span></label>
          <input
            id="phone" type="tel" required value={info.phone} onInput={update('phone')}
            placeholder="(000) 000-0000"
            class="w-full px-4 py-2.5 border border-warm-200 rounded-lg text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent bg-white"
          />
        </div>
        <div>
          <label for="email" class="block text-sm font-semibold text-stone-700 mb-1.5">Email <span class="text-accent">*</span></label>
          <input
            id="email" type="email" required value={info.email} onInput={update('email')}
            placeholder="you@example.com"
            class="w-full px-4 py-2.5 border border-warm-200 rounded-lg text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent bg-white"
          />
        </div>
      </div>

      <div>
        <label for="address" class="block text-sm font-semibold text-stone-700 mb-1.5">Service address <span class="text-accent">*</span></label>
        <input
          id="address" type="text" required value={info.address} onInput={update('address')}
          placeholder="123 Main St, Macon, GA"
          class="w-full px-4 py-2.5 border border-warm-200 rounded-lg text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent bg-white"
        />
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label for="date" class="block text-sm font-semibold text-stone-700 mb-1.5">Preferred date <span class="text-accent">*</span></label>
          <input
            id="date" type="date" required value={info.preferredDate} onInput={update('preferredDate')}
            min={todayISO()}
            class="w-full px-4 py-2.5 border border-warm-200 rounded-lg text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent bg-white"
          />
          <p class="text-xs text-stone-500 mt-1">We book {API.hoursLabel}</p>
        </div>
        <div>
          <label class="block text-sm font-semibold text-stone-700 mb-1.5">Time of day</label>
          <div class="grid grid-cols-3 gap-1.5 p-1 bg-warm-50 border border-warm-200 rounded-lg">
            {WINDOWS.map((w) => (
              <button
                type="button"
                onClick={() => setInfo({ ...info, preferredWindow: w.value })}
                class={`py-1.5 text-sm font-semibold rounded transition-colors cursor-pointer ${info.preferredWindow === w.value ? 'bg-warm-700 text-white' : 'text-stone-600 hover:text-accent'}`}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label for="message" class="block text-sm font-semibold text-stone-700 mb-1.5">
          Tell us about your project <span class="text-stone-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="message" rows={3} value={info.message} onInput={update('message')}
          placeholder="Garage cleanout — about a truck load of old furniture, paint cans, yard junk."
          class="w-full px-4 py-2.5 border border-warm-200 rounded-lg text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent bg-white resize-none"
        />
      </div>

      {error && (
        <div class="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        class="w-full bg-accent hover:bg-accent-dark text-white px-6 py-3.5 rounded-xl font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Finding open times…
          </>
        ) : (
          <>
            Find available times <span aria-hidden="true">→</span>
          </>
        )}
      </button>

      <p class="text-xs text-stone-500 text-center">
        We never share your info. Used only to confirm your appointment.
      </p>
    </form>
  )
}
