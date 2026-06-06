import { useRef, useState, useEffect, Fragment } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { presets } from '../lib/presets'
import { fontFileUrl, familyName, BUNDLED_FALLBACK } from '../lib/fontFiles'
import type { HeroState } from '../lib/types'

gsap.registerPlugin(useGSAP)

/** Map text alignment to the flex cross-axis alignment of the .hero column. */
const ALIGN_ITEMS = { left: 'flex-start', center: 'center', right: 'flex-end' } as const

type Props = {
  state: HeroState
  /** Bumping this forces a replay without any other state change. */
  runId: number
}

/** Drive the palette colours onto the global CSS variables. Shared by both
 *  rendering branches so baked-colour effects + the draw stroke read fresh
 *  values at build time. */
function applyColors(c: HeroState['colors']) {
  const root = document.documentElement.style
  root.setProperty('--canvas', c.canvas)
  root.setProperty('--c1', c.c1)
  root.setProperty('--c2', c.c2)
  root.setProperty('--c3', c.c3)
}

/**
 * Dispatcher: a draw-kind preset renders SVG glyph outlines (`DrawStage`);
 * every other preset uses the hand-rolled split-text path (`SpansStage`).
 * Kept hook-free so switching presets cleanly unmounts/mounts the right branch
 * (each child owns a stable set of hooks).
 */
export function HeroStage({ state, runId }: Props) {
  const def = presets[state.preset]
  return def.kind === 'draw' ? (
    <DrawStage state={state} runId={runId} />
  ) : (
    <SpansStage state={state} runId={runId} />
  )
}

/**
 * Renders the split headline (word / char spans) and drives the active
 * preset's GSAP timeline. useGSAP scopes all selectors to this subtree and
 * reverts the previous timeline (including looping tweens) whenever any
 * dependency changes — that replaces the PoC's manual kill()/killTweensOf().
 */
function SpansStage({ state, runId }: Props) {
  const scope = useRef<HTMLDivElement>(null)
  const def = presets[state.preset]

  useGSAP(
    () => {
      // Apply theme colours BEFORE building the timeline, so baked-colour
      // effects (Glitch shadow, Neon glow read var(--c2)/var(--c3) at build
      // time) always pick up the current values on a recolour/replay.
      applyColors(state.colors)

      const units = gsap.utils.toArray<HTMLElement>('.u')
      if (!units.length) return

      // React reuses the .u spans (keyed by index) across keystrokes, so they
      // can carry leftover inline styles from a prior interrupted tween. Clear
      // them first: gsap.from() captures each element's *current* value as its
      // end target, and a stale opacity:0 would make it animate from 0 to 0
      // (invisible forever) — leaving only freshly-added chars visible.
      gsap.set(units, { clearProps: 'all' })

      def.build(units, { speed: state.speed, stagger: state.stagger })

      // tagline reveal
      gsap.fromTo(
        '.tag',
        { opacity: 0, y: 10 },
        { opacity: 0.9, y: 0, duration: 0.6, delay: 0.4, ease: 'power2.out' },
      )
    },
    {
      scope,
      // NOTE: state.headline is intentionally NOT a dependency. The split spans
      // are React-driven, so editing the headline updates the text live and the
      // new chars render at their natural CSS opacity (immediately readable).
      // Re-running the entrance reveal on every keystroke restarted a ~1.5s
      // staggered animation each time, leaving the text faint/unreadable while
      // typing. The reveal now fires on load and on any replay/preset/style
      // change (runId, preset, font, colours, speed, stagger).
      dependencies: [
        state.preset,
        state.font,
        state.colors.canvas,
        state.colors.c1,
        state.colors.c2,
        state.colors.c3,
        state.speed,
        state.stagger,
        runId,
      ],
    },
  )

  const words = state.headline.split(' ')

  return (
    <div className="canvas">
      <div
        className="hero"
        ref={scope}
        style={{
          transform: `scale(${state.scale})`,
          alignItems: ALIGN_ITEMS[state.align],
          textAlign: state.align,
        }}
      >
        <h1
          data-testid="headline"
          style={{
            fontFamily: state.font
              ? `"${state.font}", ${def.font}, serif`
              : `${def.font}, serif`,
            fontWeight: state.weight || def.weight,
            letterSpacing: def.tracking,
          }}
        >
          {words.map((word, wi) => (
            <Fragment key={wi}>
              <span className="word">
                {[...word].map((ch, ci) => (
                  <span className="u" key={ci}>
                    {ch}
                  </span>
                ))}
              </span>
              {wi < words.length - 1 && (
                <span className="space u">{' '}</span>
              )}
            </Fragment>
          ))}
        </h1>
        <div className="tag" data-testid="tagline">
          {state.tagline}
        </div>
      </div>
    </div>
  )
}

/** Path size the glyphs are laid out at (SVG user units). The rendered size is
 *  governed by CSS on .draw-svg; this is just the internal coordinate scale. */
const DRAW_SIZE = 200

type Glyphs = { ds: string[]; width: number; height: number }

/**
 * Draw-on effect: parses the headline into real per-glyph vector outlines with
 * opentype.js, renders them as SVG <path>s, then strokes each on
 * (stroke-dashoffset, GSAP core — no DrawSVG plugin), optionally filling them
 * solid afterwards. Slice 1 always uses the bundled face; following the picked
 * Google Font is layered on later.
 */
function DrawStage({ state, runId }: Props) {
  const scope = useRef<HTMLDivElement>(null)
  const def = presets[state.preset]
  const [glyphs, setGlyphs] = useState<Glyphs | null>(null)

  // Load the font binary + compute glyph outlines whenever the text changes.
  useEffect(() => {
    let cancelled = false
    const text = state.headline
    if (!text.trim()) {
      setGlyphs({ ds: [], width: 0, height: DRAW_SIZE })
      return
    }
    ;(async () => {
      try {
        const mod = await import('opentype.js')
        const opentype = (mod as unknown as { default?: typeof mod }).default ?? mod
        // Resolve the family: an explicit picker font, else the draw preset's
        // own face. Try its jsDelivr .woff; on any fetch/parse failure fall back
        // to the bundled face so the headline always draws.
        const family = state.font || familyName(def.font)
        const parse = async (url: string) => {
          const r = await fetch(url)
          if (!r.ok) throw new Error(`font ${r.status}`)
          return opentype.parse(await r.arrayBuffer())
        }
        let font
        try {
          font = await parse(fontFileUrl(family))
        } catch {
          font = await parse(BUNDLED_FALLBACK)
        }
        if (cancelled) return
        const unit = DRAW_SIZE / font.unitsPerEm
        const ascent = font.ascender * unit
        const descent = font.descender * unit // negative
        const height = ascent - descent
        const width = font.getAdvanceWidth(text, DRAW_SIZE)
        const ds = font
          .getPaths(text, 0, ascent, DRAW_SIZE)
          .map((p) => p.toPathData(2))
        if (!cancelled) setGlyphs({ ds, width, height })
      } catch {
        // Never blank the stage: leave whatever was last drawn.
        if (!cancelled) setGlyphs((g) => g ?? { ds: [], width: 0, height: DRAW_SIZE })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [state.headline, state.preset, state.font])

  // Stroke the outlines on once they're in the DOM.
  useGSAP(
    () => {
      applyColors(state.colors)
      const paths = gsap.utils.toArray<SVGPathElement>('.glyph')
      if (!paths.length) return

      paths.forEach((p) => {
        const len = p.getTotalLength()
        gsap.set(p, { strokeDasharray: len, strokeDashoffset: len, fillOpacity: 0 })
      })

      // Per-char draw stagger derived from the Stagger slider, with a small
      // floor so each letter still reads as drawn in sequence at stagger=0.
      const drawStagger = state.stagger * 2 + 0.06
      const drawDur = 0.8 / state.speed

      const tl = gsap.timeline()
      tl.to(paths, {
        strokeDashoffset: 0,
        duration: drawDur,
        ease: 'power1.inOut',
        stagger: drawStagger,
      })
      if (state.drawFill) {
        // Same stagger, offset by one stroke duration → each glyph fills in
        // right after its own outline finishes drawing (not all at the end).
        tl.to(
          paths,
          {
            fillOpacity: 1,
            duration: 0.45 / state.speed,
            ease: 'power2.out',
            stagger: drawStagger,
          },
          drawDur,
        )
      }

      gsap.fromTo(
        '.tag',
        { opacity: 0, y: 10 },
        { opacity: 0.9, y: 0, duration: 0.6, delay: 0.4, ease: 'power2.out' },
      )
    },
    {
      scope,
      dependencies: [
        glyphs,
        state.drawFill,
        state.colors.canvas,
        state.colors.c1,
        state.colors.c2,
        state.colors.c3,
        state.speed,
        state.stagger,
        runId,
      ],
    },
  )

  return (
    <div className="canvas">
      <div
        className="hero"
        ref={scope}
        style={{
          transform: `scale(${state.scale})`,
          alignItems: ALIGN_ITEMS[state.align],
          textAlign: state.align,
        }}
      >
        {glyphs && glyphs.ds.length > 0 && (
          <svg
            className="draw-svg"
            data-testid="draw-svg"
            viewBox={`0 0 ${glyphs.width} ${glyphs.height}`}
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label={state.headline}
          >
            {glyphs.ds.map(
              (d, i) =>
                d && (
                  <path
                    key={i}
                    className="glyph"
                    d={d}
                    fill="var(--c1)"
                    stroke="var(--c1)"
                    strokeWidth={3}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                ),
            )}
          </svg>
        )}
        <div className="tag" data-testid="tagline">
          {state.tagline}
        </div>
      </div>
    </div>
  )
}
