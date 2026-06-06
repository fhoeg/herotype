import { useEffect, useState } from 'react'
import { HeroStage } from './components/HeroStage'
import { ControlPanel } from './components/ControlPanel'
import { presets } from './lib/presets'
import { palettes } from './lib/palettes'
import { parseMood } from './lib/mood'
import { buildSnippet } from './lib/exportSnippet'
import { loadGoogleFont } from './lib/fonts'
import type { HeroState } from './lib/types'

const INITIAL: HeroState = {
  headline: 'Make it move.',
  tagline: 'vibe code festival 2026',
  preset: 'rise',
  font: '',
  palette: 'ember',
  colors: { ...palettes.ember },
  drawFill: true,
  speed: 1,
  stagger: 0.04,
  scale: 1,
  align: 'center',
}

export default function App() {
  const [state, setState] = useState<HeroState>(INITIAL)
  const [runId, setRunId] = useState(0)
  const [copied, setCopied] = useState(false)
  const [lastMood, setLastMood] = useState<{
    presetName: string
    palette: string
    tagline: string
  } | null>(null)

  // CSS variables (--canvas/--c1/--c2/--c3) are applied inside HeroStage right
  // before the timeline builds, so baked-colour effects (Glitch/Neon) always
  // read fresh values. (Doing it here in a parent effect runs too late — child
  // effects flush first.)

  // Lazily pull in the selected Google Font (no-op for preset default).
  useEffect(() => {
    loadGoogleFont(state.font)
  }, [state.font])

  const patch = (next: Partial<HeroState>) => setState((s) => ({ ...s, ...next }))
  const replay = () => setRunId((n) => n + 1)

  const generate = (mood: string) => {
    const r = parseMood(mood)
    patch({
      preset: r.preset,
      palette: r.palette,
      colors: { ...palettes[r.palette] },
      speed: r.speed,
      tagline: r.tagline,
    })
    setLastMood({
      presetName: presets[r.preset].name,
      palette: r.palette,
      tagline: r.tagline,
    })
    replay()
  }

  const copyCode = async () => {
    await navigator.clipboard?.writeText(buildSnippet(state))
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
              ↻ replay
            </button>
            <button className="ghost" data-testid="copy" onClick={copyCode}>
              {copied ? '✓ copied' : '⧉ copy code'}
            </button>
          </div>
        </div>
        <HeroStage state={state} runId={runId} />
      </section>

      <ControlPanel
        state={state}
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
      />
    </div>
  )
}
