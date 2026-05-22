import { useState, useMemo, useEffect, useRef } from 'preact/hooks'
import { CONFIG } from '../config'

const LOAD_SIZES = CONFIG.pricing.loadSizes
const ADD_ONS = CONFIG.pricing.addOns
const CONDITIONS = CONFIG.pricing.conditions
const DUMPSTERS = CONFIG.dumpsters
const PER_EXTRA_DAY = CONFIG.rental.perExtraDay // $100/day past the included days

const fmt = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })

export default function Estimator() {
  const [mode, setMode] = useState<'haul' | 'dumpster'>('haul')

  // Haul state
  const [loadId, setLoadId] = useState(LOAD_SIZES[2].id) // default 1/4 truck
  const [addOnCounts, setAddOnCounts] = useState<Record<string, number>>({})
  const [conditionFlags, setConditionFlags] = useState<Record<string, boolean>>({})

  // Dumpster state
  const [dumpsterId, setDumpsterId] = useState(DUMPSTERS[1]?.id ?? DUMPSTERS[0].id)
  const [extraDays, setExtraDays] = useState(0)

  const setAddOn = (id: string, v: number) => setAddOnCounts({ ...addOnCounts, [id]: v })
  const setCondition = (id: string, v: boolean) => setConditionFlags({ ...conditionFlags, [id]: v })

  // ─── Haul totals ────────────────────────────────────────────────────────
  const haul = useMemo(() => {
    const size = LOAD_SIZES.find((s) => s.id === loadId)!
    const addOnTotal = ADD_ONS.reduce((sum, a) => sum + (addOnCounts[a.id] || 0) * a.price, 0)
    const conditionTotal = CONDITIONS.reduce(
      (sum, c) => sum + (conditionFlags[c.id] ? c.price : 0),
      0
    )
    const low = size.low + addOnTotal + conditionTotal
    const high = size.high + addOnTotal + conditionTotal
    return { size, addOnTotal, conditionTotal, low, high }
  }, [loadId, addOnCounts, conditionFlags])

  // ─── Dumpster totals ────────────────────────────────────────────────────
  const dumpster = useMemo(() => {
    const d = DUMPSTERS.find((x) => x.id === dumpsterId) ?? DUMPSTERS[0]
    const extraTotal = extraDays * PER_EXTRA_DAY
    const total = d.price + extraTotal
    return { d, extraDays, extraTotal, totalDays: d.days + extraDays, low: total, high: total }
  }, [dumpsterId, extraDays])

  const current = mode === 'haul' ? haul : dumpster

  // ─── Animated counter ───────────────────────────────────────────────────
  const [displayLow, setDisplayLow] = useState(0)
  const [displayHigh, setDisplayHigh] = useState(0)
  const animRef = useRef<number | null>(null)
  useEffect(() => {
    const targetLow = current.low
    const targetHigh = current.high
    const startLow = displayLow
    const startHigh = displayHigh
    let frame = 0
    if (animRef.current !== null) cancelAnimationFrame(animRef.current)
    const tick = () => {
      frame++
      const ease = 1 - Math.pow(1 - frame / 20, 3)
      setDisplayLow(startLow + (targetLow - startLow) * ease)
      setDisplayHigh(startHigh + (targetHigh - startHigh) * ease)
      if (frame < 20) animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)
    return () => {
      if (animRef.current !== null) cancelAnimationFrame(animRef.current)
    }
  }, [current.low, current.high])

  return (
    <div>
      {/* Mode tabs — Haul / Dumpster */}
      <div class="flex bg-stone-800 border border-stone-700 rounded-xl p-1 mb-5 max-w-md">
        {(['haul', 'dumpster'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            class={`flex-1 px-4 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-all cursor-pointer ${
              mode === m ? 'bg-accent text-white shadow' : 'text-warm-300 hover:text-warm-100'
            }`}
          >
            {m === 'haul' ? 'Junk Haul' : 'Dumpster'}
          </button>
        ))}
      </div>

      <div class="bg-stone-800 border border-stone-700 rounded-xl px-5 py-3.5 mb-5 flex items-start gap-3">
        <span class="text-lg mt-0.5">🧮</span>
        <div class="text-sm text-warm-300 leading-relaxed">
          {mode === 'haul' ? (
            <>
              <strong class="text-warm-100">Pick what fits your pile.</strong> Add anything heavy or awkward. We'll show you a range — and we can usually beat it.
            </>
          ) : (
            <>
              <strong class="text-warm-100">Pick your dumpster size.</strong> Flat rate, includes drop-off and pickup.
            </>
          )}
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-5 gap-6 md:gap-8">
        {/* Left: inputs */}
        <div class="lg:col-span-3 space-y-5 md:space-y-6">
          {mode === 'haul' ? (
            <>
              {/* Load-size card grid */}
              <div class="bg-accent rounded-2xl p-5 md:p-6 ring-1 ring-white/20 shadow-[0_14px_38px_-12px_rgba(0,0,0,0.6)]">
                <h2 class="font-heading text-sm font-bold text-warm-100 uppercase tracking-wider mb-4">
                  How Much Junk?
                </h2>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {LOAD_SIZES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setLoadId(s.id)}
                      class={`flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-all cursor-pointer text-center ${
                        loadId === s.id
                          ? 'border-white bg-black ring-2 ring-white/40'
                          : 'border-white/25 bg-black/40 hover:border-white/60'
                      }`}
                    >
                      <span class="text-2xl">{s.emoji}</span>
                      <span class="text-sm font-bold text-white leading-tight">{s.label}</span>
                      <span class="text-[10px] text-white/70 leading-tight">{s.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Add-ons (counted) */}
              <div class="bg-accent rounded-2xl p-5 md:p-6 ring-1 ring-white/20 shadow-[0_14px_38px_-12px_rgba(0,0,0,0.6)]">
                <h2 class="font-heading text-sm font-bold text-warm-100 uppercase tracking-wider mb-3">
                  Heavy / Awkward Stuff
                </h2>
                <div class="space-y-4">
                  {ADD_ONS.map((a) => (
                    <NumInput
                      key={a.id}
                      label={a.label}
                      sub={`${a.sub} · +$${a.price} each`}
                      value={addOnCounts[a.id] || 0}
                      onChange={(v) => setAddOn(a.id, v)}
                      max={20}
                    />
                  ))}
                </div>
              </div>

              {/* Conditions (toggled) */}
              <div class="bg-accent rounded-2xl p-5 md:p-6 ring-1 ring-white/20 shadow-[0_14px_38px_-12px_rgba(0,0,0,0.6)]">
                <h2 class="font-heading text-sm font-bold text-warm-100 uppercase tracking-wider mb-3">
                  Site Conditions
                </h2>
                <div class="space-y-4">
                  {CONDITIONS.map((c) => (
                    <Toggle
                      key={c.id}
                      label={c.label}
                      sub={`+$${c.price}`}
                      checked={!!conditionFlags[c.id]}
                      onChange={(v) => setCondition(c.id, v)}
                    />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div class="bg-accent rounded-2xl p-5 md:p-6 ring-1 ring-white/20 shadow-[0_14px_38px_-12px_rgba(0,0,0,0.6)]">
              <h2 class="font-heading text-sm font-bold text-warm-100 uppercase tracking-wider mb-4">
                Pick a Size
              </h2>
              <div class="space-y-3">
                {DUMPSTERS.map((d) => (
                  <label key={d.id} class="block cursor-pointer">
                    <input
                      type="radio"
                      name="dumpster-size"
                      value={d.id}
                      checked={dumpsterId === d.id}
                      onChange={() => setDumpsterId(d.id)}
                      class="peer sr-only"
                    />
                    <div class="bg-black/40 border-2 border-white/25 p-4 rounded-xl peer-checked:border-white peer-checked:bg-black peer-checked:ring-2 peer-checked:ring-white/40 transition-all">
                      <div class="flex justify-between items-start gap-3">
                        <div>
                          <div class="text-white/80 text-[10px] tracking-widest uppercase font-bold mb-1">
                            {d.tagline}
                          </div>
                          <h3 class="font-heading text-xl font-bold text-white">{d.name}</h3>
                          <p class="text-white/70 text-xs">{d.capacity} · {d.days} days</p>
                        </div>
                        <div class="font-heading text-2xl font-bold text-white shrink-0">
                          ${d.price}
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              {/* Extra days — $100/day past the included rental */}
              <div class="mt-5 pt-5 border-t border-white/15">
                <h2 class="font-heading text-sm font-bold text-warm-100 uppercase tracking-wider mb-3">
                  Keep It Longer?
                </h2>
                <NumInput
                  label="Extra days"
                  sub={`${dumpster.d.days} days included · +$${PER_EXTRA_DAY} each`}
                  value={extraDays}
                  onChange={setExtraDays}
                  max={30}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right: sticky total + breakdown */}
        <div class="lg:col-span-2">
          <div class="lg:sticky lg:top-32 space-y-4">
            {/* Big number */}
            <div class="bg-accent rounded-2xl p-6 text-white relative overflow-hidden shadow-[0_0_44px_-8px_rgba(30,111,255,0.75)] ring-1 ring-white/20">
              <div class="absolute top-0 right-0 w-40 h-40 bg-white/15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div class="relative">
                <span class="text-[10px] text-white/80 font-bold uppercase tracking-wider">
                  {mode === 'haul' ? 'Estimated Range' : 'Flat Rate'}
                </span>
                <div class="font-heading text-3xl md:text-4xl font-bold tracking-tight mt-1">
                  {mode === 'haul' ? (
                    <>${fmt(displayLow)} – ${fmt(displayHigh)}</>
                  ) : (
                    <>${fmt(displayLow)}</>
                  )}
                </div>
                <div class="text-white/70 text-xs mt-1">
                  {mode === 'haul' ? haul.size.label : `${dumpster.d.name} · ${dumpster.totalDays} days`}
                </div>
              </div>
            </div>

            {/* Breakdown */}
            <div class="bg-accent rounded-2xl p-5 md:p-6 ring-1 ring-white/20 shadow-[0_14px_38px_-12px_rgba(0,0,0,0.6)]">
              <h3 class="text-xs font-bold text-warm-100 uppercase tracking-wider mb-3">Breakdown</h3>
              <div class="space-y-2 text-xs">
                {mode === 'haul' ? (
                  <>
                    <div class="flex justify-between">
                      <span class="text-warm-300">{haul.size.label}</span>
                      <span class="font-bold text-warm-100">${fmt(haul.size.low)} – ${fmt(haul.size.high)}</span>
                    </div>
                    {haul.addOnTotal > 0 && (
                      <div class="flex justify-between">
                        <span class="text-warm-300">Heavy / awkward items</span>
                        <span class="font-bold text-warm-100">+${fmt(haul.addOnTotal)}</span>
                      </div>
                    )}
                    {haul.conditionTotal > 0 && (
                      <div class="flex justify-between">
                        <span class="text-warm-300">Site conditions</span>
                        <span class="font-bold text-warm-100">+${fmt(haul.conditionTotal)}</span>
                      </div>
                    )}
                    <div class="flex justify-between pt-2 border-t border-stone-700">
                      <span class="font-bold text-warm-100">Range</span>
                      <span class="font-bold text-accent">${fmt(haul.low)} – ${fmt(haul.high)}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div class="flex justify-between">
                      <span class="text-warm-300">Rental ({dumpster.d.days} days)</span>
                      <span class="font-bold text-warm-100">${fmt(dumpster.d.price)}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-warm-300">Drop-off + pickup</span>
                      <span class="font-bold text-warm-100">Included</span>
                    </div>
                    {dumpster.extraDays > 0 && (
                      <div class="flex justify-between">
                        <span class="text-warm-300">+{dumpster.extraDays} extra day{dumpster.extraDays > 1 ? 's' : ''} @ ${PER_EXTRA_DAY}</span>
                        <span class="font-bold text-warm-100">+${fmt(dumpster.extraTotal)}</span>
                      </div>
                    )}
                    <div class="flex justify-between pt-2 border-t border-stone-700">
                      <span class="font-bold text-warm-100">Total</span>
                      <span class="font-bold text-accent">${fmt(dumpster.low)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* The disclaimer the user asked for */}
              <div class="mt-4 bg-stone-900 border border-accent/30 rounded-xl px-3 py-3 text-[11px] text-warm-200 text-center leading-relaxed">
                {mode === 'haul' ? (
                  <>
                    <strong class="text-accent">We can usually beat it.</strong>
                    {' '}This is a ballpark. Final price is locked on-site before we load anything.
                    {' '}<a href={CONFIG.phone.href} class="text-accent-light font-bold no-underline hover:text-accent">Call {CONFIG.phone.display}</a> for a free firm quote.
                  </>
                ) : (
                  <>
                    Flat-rate rental. Over-weight or hazardous loads may incur disposal fees.
                    {' '}<a href={CONFIG.phone.href} class="text-accent-light font-bold no-underline hover:text-accent">Call {CONFIG.phone.display}</a> with questions.
                  </>
                )}
              </div>

              <div class="mt-3 grid grid-cols-2 gap-2">
                <a
                  href={CONFIG.phone.href}
                  class="bg-stone-700 hover:bg-stone-600 text-warm-100 py-3 rounded-xl font-bold text-xs flex items-center justify-center no-underline uppercase tracking-wider transition-colors"
                >
                  Call Now
                </a>
                <a
                  href={mode === 'haul' ? CONFIG.cta.primary.href : CONFIG.cta.secondary.href}
                  class="bg-accent hover:bg-accent-dark text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center no-underline uppercase tracking-wider transition-colors"
                >
                  {mode === 'haul' ? 'Book Pickup' : 'Reserve'}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────

type NumInputProps = {
  label: string
  sub?: string
  value: number
  onChange: (v: number) => void
  max?: number
}

function NumInput({ label, sub, value, onChange, max = 20 }: NumInputProps) {
  return (
    <div class="flex items-center justify-between gap-3">
      <div class="flex-1 min-w-0">
        <div class="text-sm text-white leading-tight">{label}</div>
        {sub && <div class="text-[10px] text-white/70 leading-tight">{sub}</div>}
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          class="w-10 h-10 rounded-lg bg-black/30 hover:bg-black/50 text-white text-lg font-bold flex items-center justify-center cursor-pointer transition-colors select-none"
        >
          -
        </button>
        <span class="w-8 text-center text-sm font-bold text-white">{value}</span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          class="w-10 h-10 rounded-lg bg-black/30 hover:bg-black/50 text-white text-lg font-bold flex items-center justify-center cursor-pointer transition-colors select-none"
        >
          +
        </button>
      </div>
    </div>
  )
}

type ToggleProps = {
  label: string
  sub?: string
  checked: boolean
  onChange: (checked: boolean) => void
}

function Toggle({ label, sub, checked, onChange }: ToggleProps) {
  return (
    <div class="flex items-center justify-between gap-3">
      <div class="flex-1 min-w-0">
        <div class="text-sm text-white leading-tight">{label}</div>
        {sub && <div class="text-[10px] text-white/70 leading-tight">{sub}</div>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        class={`shrink-0 w-12 h-6 rounded-full transition-all cursor-pointer relative ${checked ? 'bg-black' : 'bg-black/30'}`}
      >
        <div
          class={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-0.5 transition-all ${checked ? 'left-[26px]' : 'left-0.5'}`}
        />
      </button>
    </div>
  )
}
