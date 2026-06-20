import { useState } from 'react'
import { presets } from '../lib/presets'
import { palettes } from '../lib/palettes'
import { googleFonts, loadGoogleFont } from '../lib/fonts'
import { moodChips } from '../lib/mood'
import type { HeroState } from '../lib/types'

// Sub-line font choices: the headline default (Fraunces) plus the full picker
// list — matches the AI's subFont enum so any AI pick is selectable here.
const SUB_FONTS = ['Fraunces', ...googleFonts]

type Props = {
  state: HeroState
  /** Weights the active face actually ships (from the fontsource API). */
  weights: number[]
  setHeadline: (v: string) => void
  setTagline: (v: string) => void
  setAlign: (a: 'left' | 'center' | 'right') => void
  generate: (mood: string) => void
  setPreset: (key: string) => void
  setFont: (family: string) => void
  setTaglineFont: (family: string) => void
  setWeight: (w: number) => void
  setDrawFill: (fill: boolean) => void
  setPalette: (key: string) => void
  setColor: (channel: 'canvas' | 'c1' | 'c2' | 'c3', value: string) => void
  setSpeed: (v: number) => void
  setStagger: (v: number) => void
  setScale: (v: number) => void
  setHeadlineScale: (v: number) => void
  setTaglineScale: (v: number) => void
  /** True while the AI style request is in flight. */
  generating: boolean
  /** Last mood that was generated, for the live hint line. */
  lastMood: {
    effectName: string
    tagline: string
    ai: boolean
    reasoning?: string
  } | null
}

export function ControlPanel({
  state,
  weights,
  setHeadline,
  setTagline,
  setAlign,
  generate,
  setPreset,
  setFont,
  setTaglineFont,
  setWeight,
  setDrawFill,
  setPalette,
  setColor,
  setSpeed,
  setStagger,
  setScale,
  setHeadlineScale,
  setTaglineScale,
  generating,
  lastMood,
}: Props) {
  const [mood, setMood] = useState('')

  return (
    <aside className="panel">
      {/* Primary action — describe a style and let the AI build the whole hero. */}
      <div className="ai-field">
        <h2 className="ai-title">
          Describe the style <span className="ai-badge">AI</span>
        </h2>
        <input
          type="text"
          className="ai-input"
          data-testid="mood-input"
          placeholder="e.g. haunted victorian séance"
          value={mood}
          disabled={generating}
          onChange={(e) => setMood(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !generating && generate(mood)}
        />
        <button
          className="gen ai-gen"
          data-testid="generate"
          disabled={generating}
          onClick={() => generate(mood)}
        >
          {generating ? 'Generating…' : 'Generate'}
        </button>
        <div className="chips">
          {moodChips.map((m) => (
            <button
              key={m}
              className="chip"
              disabled={generating}
              onClick={() => {
                setMood(m)
                generate(m)
              }}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="hint" data-testid="hint">
          {lastMood ? (
            lastMood.ai ? (
              <>
                → <b>{lastMood.effectName}</b> · “{lastMood.tagline}” — {lastMood.reasoning}
              </>
            ) : (
              <>
                → <b>{lastMood.effectName}</b> · “{lastMood.tagline}”{' '}
                <span className="custom-tag">offline</span>
              </>
            )
          ) : (
            'Describe a vibe. The AI picks the effect, font, weight, colours, timing — and writes the headline + sub line.'
          )}
        </div>
      </div>

      {/* Everything below tweaks what the AI produced. */}
      <div className="panel-divider">Adjust</div>

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
        <h2>Sub line</h2>
        <input
          type="text"
          data-testid="tagline-input"
          value={state.tagline}
          maxLength={50}
          onChange={(e) => setTagline(e.target.value)}
        />
      </div>

      <div className="field">
        <h2>Alignment</h2>
        <div className="seg" data-testid="align">
          {(['left', 'center', 'right'] as const).map((a) => (
            <button
              key={a}
              className={`seg-btn${state.align === a ? ' active' : ''}`}
              data-align={a}
              onClick={() => setAlign(a)}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <details className="group">
        <summary data-testid="group-font">
          <span>Font</span>
        </summary>
        <div className="group-body">
          <div className="field">
            <h2>Headline font</h2>
            <select
              className="font-select"
              data-testid="font-select"
              value={state.font}
              style={{ fontFamily: state.font ? `"${state.font}", inherit` : 'inherit' }}
              onChange={(e) => setFont(e.target.value)}
            >
              <option value="">Default (Fraunces)</option>
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
            <h2>Weight</h2>
            <select
              className="font-select"
              data-testid="weight-select"
              value={state.weight}
              onChange={(e) => setWeight(+e.target.value)}
            >
              <option value={0}>Preset default</option>
              {weights.map((w) => (
                <option key={w} value={w} style={{ fontWeight: w }}>
                  {w}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <h2>Sub line font</h2>
            <select
              className="font-select"
              data-testid="tagline-font-select"
              value={state.taglineFont}
              style={{ fontFamily: state.taglineFont ? `"${state.taglineFont}", inherit` : 'inherit' }}
              onChange={(e) => setTaglineFont(e.target.value)}
            >
              <option value="">Default (Space Mono)</option>
              {SUB_FONTS.map((f) => (
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
        </div>
      </details>

      <details className="group">
        <summary data-testid="group-effect">
          <span>Effect</span>
        </summary>
        <div className="group-body">
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

          {presets[state.preset].kind === 'draw' && (
            <div className="field">
              <h2>Draw style</h2>
              <div className="seg" data-testid="draw-fill">
                <button
                  className={`seg-btn${state.drawFill ? ' active' : ''}`}
                  data-on={state.drawFill}
                  onClick={() => setDrawFill(true)}
                >
                  Fill
                </button>
                <button
                  className={`seg-btn${!state.drawFill ? ' active' : ''}`}
                  onClick={() => setDrawFill(false)}
                >
                  Outline
                </button>
              </div>
            </div>
          )}
        </div>
      </details>

      <details className="group">
        <summary data-testid="group-tuning">
          <span>Tuning</span>
        </summary>
        <div className="group-body">
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
          <div className="slider">
            <label>
              Headline size{' '}
              <b data-testid="headline-scale-val">{state.headlineScale.toFixed(2)}×</b>
            </label>
            <input
              type="range"
              data-testid="headline-scale"
              min={0.4}
              max={2}
              step={0.05}
              value={state.headlineScale}
              onChange={(e) => setHeadlineScale(+e.target.value)}
            />
          </div>
          <div className="slider">
            <label>
              Sub line size{' '}
              <b data-testid="tagline-scale-val">{state.taglineScale.toFixed(2)}×</b>
            </label>
            <input
              type="range"
              data-testid="tagline-scale"
              min={0.4}
              max={3}
              step={0.05}
              value={state.taglineScale}
              onChange={(e) => setTaglineScale(+e.target.value)}
            />
          </div>
        </div>
      </details>

      <details className="group">
        <summary data-testid="group-color">
          <span>
            Color {state.palette === '' && <span className="custom-tag">custom</span>}
          </span>
        </summary>
        <div className="group-body">
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
          <div className="colors">
            <label className="color-row">
              <span>Font</span>
              <input
                type="color"
                data-testid="font-color"
                value={state.colors.c1}
                onChange={(e) => setColor('c1', e.target.value)}
              />
            </label>
            <label className="color-row">
              <span>Effect 1</span>
              <input
                type="color"
                data-testid="effect-color-1"
                value={state.colors.c2}
                onChange={(e) => setColor('c2', e.target.value)}
              />
            </label>
            <label className="color-row">
              <span>Effect 2</span>
              <input
                type="color"
                data-testid="effect-color-2"
                value={state.colors.c3}
                onChange={(e) => setColor('c3', e.target.value)}
              />
            </label>
            <label className="color-row">
              <span>Background</span>
              <input
                type="color"
                data-testid="bg-color"
                value={state.colors.canvas}
                onChange={(e) => setColor('canvas', e.target.value)}
              />
            </label>
          </div>
        </div>
      </details>

      <div className="foot">
        GSAP 3.12 · React · Vite
        <br />
        preset-driven · copy-to-clipboard export
      </div>
    </aside>
  )
}
