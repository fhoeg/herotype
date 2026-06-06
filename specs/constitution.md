# HEROTYPE — Constitution

Non-negotiable principles for this build. Agents and humans: read this before
touching code. If a change violates a principle here, stop and flag it.

## Context
A 3-hour vibe-code hackathon PoC. Optimize for **demo wow-per-hour** and a
**closeable core loop**, not completeness. It is a *generator with tuning*,
not an editor.

## The core loop (must always work)
```
type headline → type mood → Generate → hero animates → nudge sliders → copy code
```
If this closes end-to-end, the demo lands. Everything else is secondary.

## The wow beat
The **mood prompt**. One phrase reconfigures effect + palette + timing +
tagline at once. Lead every demo with this, not the sliders.

## Tech — LOCKED (do not reopen mid-hackathon)
- **GSAP 3.12 core** for all timelines. CSS variables for theming.
- **React + Vite + TypeScript** as the app shell (chosen over single-file HTML
  to allow a clean Three.js / react-three-fiber expansion *after* the hackathon).
- Per-character split is **hand-rolled** (`.u` spans inside `.word` spans). No
  premium GSAP plugins (no SplitText).
- **No** three.js / shaders / WebGL during the 3h window. 3D is a post-hackathon
  expansion behind the existing `Preset` contract — see plan.md.

Keeping rendering paradigms open is what kills a 3-hour build. The framework is
*expandable*, but the hackathon scope is *not*.

## Fake-vs-real (decided up front)
- **Fake:** LLM mood-parsing (keyword matcher), code export (styled stub),
  any 3D look (CSS transforms + blend modes + glow).
- **Real:** the six animations, the live preview, the mood→preset reconfiguration.

## Architecture invariants
- Everything themable flows through CSS variables: `--c1 --c2 --canvas
  --display --font-weight --tracking`. Palette/preset swaps are one-liners.
- An **effect = one `Preset` object** in `src/lib/presets.ts`. Adding a look
  never touches component code.
- The **mood parser interface is `(string) → MoodResult`**. A real LLM call is
  a drop-in replacement, never a dependency.
- Replay/cleanup is handled by `useGSAP` scope revert — do not hand-roll
  `kill()` unless a tween escapes the scope.

## Cut list (when behind, in this order)
1. Drop to 4 presets → 2. Drop palette switching → 3. Drop the scale slider.

**Never cut:** headline input · one working animation · the mood Generate beat.
