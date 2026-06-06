import { useEffect, useState } from 'react'
import { HeroStage } from './components/HeroStage'
import { ControlPanel } from './components/ControlPanel'
import { presets } from './lib/presets'
import { palettes } from './lib/palettes'
import { parseMood } from './lib/mood'
import { buildSnippet } from './lib/exportSnippet'
import type { HeroState } from './lib/types'

const INITIAL: HeroState = {
  headline: 'Make it move.',
  tagline: 'vibe code festival 2026',
  preset: 'rise',
  palette: 'ember',
  speed: 1,
  stagger: 0.04,
  scale: 1,
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

  // Drive palette onto CSS variables. --c1/--c2/--canvas cascade from :root.
  useEffect(() => {
    const p = palettes[state.palette]
    if (!p) return
    const root = document.documentElement.style
    root.setProperty('--canvas', p.canvas)
    root.setProperty('--c1', p.c1)
    root.setProperty('--c2', p.c2)
  }, [state.palette])

  const patch = (next: Partial<HeroState>) => setState((s) => ({ ...s, ...next }))
  const replay = () => setRunId((n) => n + 1)

  const generate = (mood: string) => {
    const r = parseMood(mood)
    patch({ preset: r.preset, palette: r.palette, speed: r.speed, tagline: r.tagline })
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
        generate={generate}
        setPreset={(preset) => {
          patch({ preset })
          replay()
        }}
        setPalette={(palette) => {
          patch({ palette })
          replay()
        }}
        setSpeed={(speed) => patch({ speed })}
        setStagger={(stagger) => patch({ stagger })}
        setScale={(scale) => patch({ scale })}
      />
    </div>
  )
}
