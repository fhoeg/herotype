// `gsap` is an ambient global namespace from gsap's type defs — no import needed
// to reference `gsap.core.Timeline` in a type position.

/** Tuning params passed into every preset's timeline builder. */
export type Params = {
  /** Playback speed multiplier (0.4–2.2×). Higher = faster. */
  speed: number
  /** Per-unit stagger in seconds (0–0.12s). */
  stagger: number
}

/**
 * A preset is a self-contained "look": a font personality plus a GSAP
 * timeline builder. `build` receives the split character units (.u elements)
 * and the tuning params, and returns a timeline. This is the single
 * extension point — adding an effect means adding one Preset object.
 *
 * To add a 3D / canvas effect later, a preset can ignore `units` and instead
 * drive a sibling <canvas> / r3f scene; the contract stays the same.
 */
export type Preset = {
  key: string
  name: string
  desc: string
  /** CSS font-family value, e.g. '"Fraunces"'. */
  font: string
  weight: number
  tracking: string
  /**
   * Rendering mode. `'spans'` (default, omittable) animates the per-character
   * `.u` spans via `build`. `'draw'` ignores `build` and instead renders SVG
   * glyph outlines that the stage strokes on — the sanctioned rendering-branch
   * extension this contract anticipates (cf. the post-hackathon 3D path).
   */
  kind?: 'spans' | 'draw'
  build: (units: HTMLElement[], p: Params) => gsap.core.Timeline
}

/** A palette is a set of CSS-variable values driven onto the stage. */
export type Palette = {
  canvas: string
  /** font / headline colour → --c1 */
  c1: string
  /** primary effect / accent colour → --c2 */
  c2: string
  /** secondary effect accent → --c3 (e.g. Glitch's 2nd shadow channel) */
  c3: string
}

/** Result of parsing a free-text mood phrase. */
export type MoodResult = {
  preset: string
  palette: string
  speed: number
  tagline: string
}

/** The full controllable state of the hero. */
export type HeroState = {
  headline: string
  tagline: string
  preset: string
  /** Google Font override; '' = use the active preset's own font. */
  font: string
  /** Active palette key for the swatch highlight; '' once a colour is tweaked ("Custom"). */
  palette: string
  /** The actual colours rendered + exported. Source of truth (a palette just seeds these). */
  colors: { canvas: string; c1: string; c2: string; c3: string }
  /** Draw effect end-state: true = fill glyphs solid after stroking on; false = leave outline-only. */
  drawFill: boolean
  speed: number
  /** seconds */
  stagger: number
  scale: number
}
