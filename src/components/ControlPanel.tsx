import { useState } from 'react'
import { presets } from '../lib/presets'
import { palettes } from '../lib/palettes'
import { googleFonts, loadGoogleFont } from '../lib/fonts'
import { moodChips } from '../lib/mood'
import type { HeroState } from '../lib/types'

type Props = {
  state: HeroState
  setHeadline: (v: string) => void
  generate: (mood: string) => void
  setPreset: (key: string) => void
  setFont: (family: string) => void
  setPalette: (key: string) => void
  setSpeed: (v: number) => void
  setStagger: (v: number) => void
  setScale: (v: number) => void
  /** Last mood that was generated, for the live hint line. */
  lastMood: { presetName: string; palette: string; tagline: string } | null
}

export function ControlPanel({
  state,
  setHeadline,
  generate,
  setPreset,
  setFont,
  setPalette,
  setSpeed,
  setStagger,
  setScale,
  lastMood,
}: Props) {
  const [mood, setMood] = useState('')

  return (
    <aside className="panel">
      <div className="field">
        <h2>Headline</h2>
        <input
          type="text"
          data-testid="headline-input"
          value={state.headline}
          maxLength={40}
          onChange={(e) => setHeadline(e.target.value)}
        />
      </div>

      <div className="field">
        <h2>Mood → animation (the AI hook)</h2>
        <div className="mood-row">
          <input
            type="text"
            data-testid="mood-input"
            placeholder="e.g. ominous, cyberpunk, heavy"
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && generate(mood)}
          />
          <button className="gen" data-testid="generate" onClick={() => generate(mood)}>
            Generate
          </button>
        </div>
        <div className="hint" data-testid="hint">
          {lastMood ? (
            <>
              → <b>{lastMood.presetName}</b> effect · <b>{lastMood.palette}</b>{' '}
              palette · tagline “{lastMood.tagline}”
            </>
          ) : (
            'Type a vibe. The generator picks an effect, a palette, the timing — and writes a tagline.'
          )}
        </div>
        <div className="chips">
          {moodChips.map((m) => (
            <button
              key={m}
              className="chip"
              onClick={() => {
                setMood(m)
                generate(m)
              }}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <h2>Effect</h2>
        <div className="presets">
          {Object.values(presets).map((p) => (
            <button
              key={p.key}
              className={`preset${state.preset === p.key ? ' active' : ''}`}
              data-preset={p.key}
              onClick={() => setPreset(p.key)}
            >
              <div className="pname">{p.name}</div>
              <div className="pdesc">{p.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <h2>Font</h2>
        <select
          className="font-select"
          data-testid="font-select"
          value={state.font}
          style={{ fontFamily: state.font ? `"${state.font}", inherit` : 'inherit' }}
          onChange={(e) => setFont(e.target.value)}
        >
          <option value="">Preset default</option>
          {googleFonts.map((f) => (
            <option
              key={f}
              value={f}
              style={{ fontFamily: `"${f}"` }}
              onMouseEnter={() => loadGoogleFont(f)}
            >
              {f}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <h2>Tuning</h2>
        <div className="slider">
          <label>
            Speed <b data-testid="speed-val">{state.speed.toFixed(1)}×</b>
          </label>
          <input
            type="range"
            data-testid="speed"
            min={0.4}
            max={2.2}
            step={0.1}
            value={state.speed}
            onChange={(e) => setSpeed(+e.target.value)}
          />
        </div>
        <div className="slider">
          <label>
            Stagger <b data-testid="stagger-val">{Math.round(state.stagger * 1000)}ms</b>
          </label>
          <input
            type="range"
            data-testid="stagger"
            min={0}
            max={120}
            step={5}
            value={Math.round(state.stagger * 1000)}
            onChange={(e) => setStagger(+e.target.value / 1000)}
          />
        </div>
        <div className="slider">
          <label>
            Scale <b data-testid="scale-val">{state.scale.toFixed(1)}×</b>
          </label>
          <input
            type="range"
            data-testid="scale"
            min={0.6}
            max={1.6}
            step={0.05}
            value={state.scale}
            onChange={(e) => setScale(+e.target.value)}
          />
        </div>
      </div>

      <div className="field">
        <h2>Palette</h2>
        <div className="swatches">
          {Object.entries(palettes).map(([k, v]) => (
            <div
              key={k}
              className={`sw${state.palette === k ? ' active' : ''}`}
              data-palette={k}
              title={k}
              style={{
                background: `linear-gradient(135deg,${v.c1} 0 50%,${v.c2} 50% 100%)`,
              }}
              onClick={() => setPalette(k)}
            />
          ))}
        </div>
      </div>

      <div className="foot">
        GSAP 3.12 · React · Vite
        <br />
        preset-driven · copy-to-clipboard export
      </div>
    </aside>
  )
}
