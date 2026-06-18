import { useEffect, useState } from 'react'
import { HeroStage } from './components/HeroStage'
import { ControlPanel } from './components/ControlPanel'
import { presets } from './lib/presets'
import { palettes } from './lib/palettes'
import { parseMood } from './lib/mood'
import { buildExport } from './lib/exportHtml'
import { loadGoogleFont, fetchFontWeights, DEFAULT_FONT } from './lib/fonts'
import type { HeroState } from './lib/types'
import type { StyleResult } from './lib/styleSchema'

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i
/** Keep an AI hex if valid, else fall back to the current channel value. */
const safeHex = (v: string, fallback: string) => (HEX.test(v) ? v : fallback)
/** Snap a requested weight to the nearest one the chosen face actually ships. */
const nearestWeight = (weights: number[], w: number) =>
  weights.reduce((best, x) => (Math.abs(x - w) < Math.abs(best - w) ? x : best), weights[0] ?? 400)

const INITIAL: HeroState = {
  headline: 'Make it move.',
  tagline: 'static is boring',
  preset: 'rise',
  font: '',
  weight: 0,
  palette: 'ember',
  colors: { ...palettes.ember },
  drawFill: true,
  speed: 1,
  stagger: 0.04,
  scale: 1,
  headlineScale: 1,
  taglineScale: 1,
  align: 'center',
}

export default function App() {
  const [state, setState] = useState<HeroState>(INITIAL)
  const [runId, setRunId] = useState(0)
  const [copied, setCopied] = useState(false)
  /** Real weights the selected face ships (fontsource API) — drives the weight
   *  picker and which weights we actually load. */
  const [weights, setWeights] = useState<number[]>([300, 400, 500, 600, 700, 800, 900])
  /** True while the AI style request is in flight (drives the Generate button). */
  const [generating, setGenerating] = useState(false)
  const [lastMood, setLastMood] = useState<{
    effectName: string
    tagline: string
    /** true = produced by the AI; false = local keyword fallback. */
    ai: boolean
    reasoning?: string
  } | null>(null)

  // CSS variables (--canvas/--c1/--c2/--c3) are applied inside HeroStage right
  // before the timeline builds, so baked-colour effects (Glitch/Neon) always
  // read fresh values. (Doing it here in a parent effect runs too late — child
  // effects flush first.)

  // Resolve the selected face's real weights, load exactly those (so spans can
  // render any of them), and drop the active weight if this face doesn't ship
  // it — so we never request a missing weight file.
  useEffect(() => {
    let cancelled = false
    fetchFontWeights(state.font || DEFAULT_FONT).then((w) => {
      if (cancelled) return
      setWeights(w)
      loadGoogleFont(state.font, w)
      setState((s) => (s.weight && !w.includes(s.weight) ? { ...s, weight: 0 } : s))
    })
    return () => {
      cancelled = true
    }
  }, [state.font])

  const patch = (next: Partial<HeroState>) => setState((s) => ({ ...s, ...next }))
  const replay = () => setRunId((n) => n + 1)

  /** Local keyword parser — the offline / no-key / error fallback. Resets every
   *  setting like the AI path, but keeps the current headline (the offline
   *  parser has no headline to invent). */
  const applyFallback = (mood: string) => {
    const r = parseMood(mood)
    setState((s) => ({
      ...INITIAL,
      headline: s.headline,
      preset: r.preset,
      palette: r.palette,
      colors: { ...palettes[r.palette] },
      speed: r.speed,
      tagline: r.tagline,
    }))
    setLastMood({ effectName: presets[r.preset].name, tagline: r.tagline, ai: false })
    replay()
  }

  /** Apply a validated AI style result onto the hero. A new style description is
   *  a clean slate: reset every setting to defaults, then overlay the AI's
   *  choices (including a freshly written headline) so no prior tweak bleeds
   *  through. */
  const applyStyle = async (d: StyleResult) => {
    if (!presets[d.effect]) throw new Error(`unknown effect ${d.effect}`)
    const font = d.font === 'Fraunces' ? '' : d.font
    const weight = nearestWeight(await fetchFontWeights(font || DEFAULT_FONT), d.weight)
    const headline = d.headline.trim().slice(0, 40) || INITIAL.headline
    setState({
      ...INITIAL,
      headline,
      tagline: d.tagline.slice(0, 50),
      preset: d.effect,
      font,
      weight,
      palette: '', // diverged from any preset palette → "Custom"
      colors: {
        canvas: safeHex(d.colors.canvas, INITIAL.colors.canvas),
        c1: safeHex(d.colors.c1, INITIAL.colors.c1),
        c2: safeHex(d.colors.c2, INITIAL.colors.c2),
        c3: safeHex(d.colors.c3, INITIAL.colors.c3),
      },
      speed: Math.min(2.2, Math.max(0.4, d.speed)),
    })
    setLastMood({
      effectName: presets[d.effect].name,
      tagline: d.tagline.slice(0, 50),
      reasoning: d.reasoning.slice(0, 200),
      ai: true,
    })
    replay()
  }

  /** Ask the AI for a full style; fall back to the keyword parser on any failure. */
  const generate = async (mood: string) => {
    if (!mood.trim() || generating) return
    setGenerating(true)
    try {
      const res = await fetch('/api/style', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ mood }),
      })
      if (!res.ok) throw new Error(`status ${res.status}`)
      await applyStyle((await res.json()) as StyleResult)
    } catch {
      applyFallback(mood)
    } finally {
      setGenerating(false)
    }
  }

  const copyCode = async () => {
    await navigator.clipboard?.writeText(buildExport(state, weights))
    setCopied(true)
    setTimeout(() => setCopied(false), 1400)
  }

  return (
    <div className="app">
      <section className="stage">
        <div className="topbar">
          <div className="brand">
            HERO<b>TYPE</b> · type-motion generator
          </div>
          <div className="stage-actions">
            <button className="ghost" data-testid="replay" onClick={replay}>
              <span className="ico" aria-hidden="true">↻</span> replay
            </button>
            <button className="ghost" data-testid="copy" onClick={copyCode}>
              <span className="ico" aria-hidden="true">{copied ? '✓' : '⧉'}</span>{' '}
              {copied ? 'copied' : 'copy code'}
            </button>
          </div>
        </div>
        <HeroStage state={state} runId={runId} />
      </section>

      <ControlPanel
        state={state}
        weights={weights}
        generating={generating}
        lastMood={lastMood}
        setHeadline={(headline) => patch({ headline: headline || ' ' })}
        setTagline={(tagline) => patch({ tagline })}
        setAlign={(align) => patch({ align })}
        generate={generate}
        setPreset={(preset) => {
          patch({ preset })
          replay()
        }}
        setFont={(font) => patch({ font })}
        setWeight={(weight) => patch({ weight })}
        setDrawFill={(drawFill) => patch({ drawFill })}
        setPalette={(palette) => {
          patch({ palette, colors: { ...palettes[palette] } })
          replay()
        }}
        setColor={(channel, value) => {
          setState((s) => ({
            ...s,
            palette: '', // diverged from any preset → "Custom"
            colors: { ...s.colors, [channel]: value },
          }))
          replay()
        }}
        setSpeed={(speed) => patch({ speed })}
        setStagger={(stagger) => patch({ stagger })}
        setScale={(scale) => patch({ scale })}
        setHeadlineScale={(headlineScale) => patch({ headlineScale })}
        setTaglineScale={(taglineScale) => patch({ taglineScale })}
      />
    </div>
  )
}
