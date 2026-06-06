import { presets } from './presets'
import { DEFAULT_FONT } from './fonts'
import type { HeroState } from './types'

/**
 * Build a self-contained, copy-pasteable HTML stub for the current hero.
 * Markup + inline styles + a TODO comment pointing at the matching timeline.
 * (A full runnable export pipeline is intentionally out of scope — see spec.)
 */
export function buildSnippet(state: HeroState): string {
  const def = presets[state.preset]
  const c = state.colors
  const font = `"${state.font || DEFAULT_FONT}", serif`
  return `<!-- HEROTYPE export · ${def.name} -->
<div class="hero" style="background:${c.canvas};color:${c.c1};font-family:${font};text-align:center;padding:8vmin">
  <h1 style="font-size:clamp(3rem,9vw,8rem);font-weight:${state.weight || def.weight};letter-spacing:${def.tracking}">${state.headline}</h1>
  <p style="color:${c.c2};font-family:monospace;letter-spacing:.28em;text-transform:uppercase">${state.tagline}</p>
</div>
<!-- TODO: ship the matching GSAP timeline (preset "${state.preset}", speed ${state.speed}, stagger ${Math.round(
    state.stagger * 1000,
  )}ms) · accents ${c.c2} / ${c.c3} -->`
}
