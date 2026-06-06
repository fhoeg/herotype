# HEROTYPE — Implementation Plan

How the spec maps onto the React/Vite codebase. Update this when architecture
shifts; it is the contract between spec and code.

## Module map
| Concern | File | Notes |
|---|---|---|
| App shell + state + palette CSS vars | `src/App.tsx` | Single source of truth for `HeroState`; provides setters + `generate` + `replay` + `copyCode`. |
| Hero rendering + GSAP | `src/components/HeroStage.tsx` | Hand-rolled split into `.word`/`.u` spans; `useGSAP` runs the active preset, reverts on dependency change. |
| Controls UI | `src/components/ControlPanel.tsx` | Headline, mood row + chips, preset grid, sliders, palette swatches. |
| Effects | `src/lib/presets.ts` | 6 `Preset` objects. **The extension point.** |
| Palettes | `src/lib/palettes.ts` | 5 `{canvas,c1,c2}` triples. |
| Mood parser | `src/lib/mood.ts` | Keyword buckets → `MoodResult`. Swappable for LLM. |
| Export | `src/lib/exportSnippet.ts` | Styled HTML stub for clipboard. |
| Types | `src/lib/types.ts` | `Preset`, `Palette`, `MoodResult`, `HeroState`, `Params`. |

## State flow
`ControlPanel` (events) → `App` setters → `HeroState` → `HeroStage` props.
`HeroStage`'s `useGSAP` re-runs when `[headline, preset, speed, stagger, runId]`
change. `runId` is a counter bumped by `replay()` to force a re-run with no
other state change. Palette changes also bump `runId` so glow colours rebuild.

## Replay / cleanup
`useGSAP({ scope })` reverts the prior timeline — including looping
(`repeat:-1`) tweens in wave/glitch/neon — automatically on each re-run. No
manual `gsap.killTweensOf` needed as long as tweens target elements inside the
scoped subtree.

## Post-hackathon: the Three.js expansion (DO NOT build during 3h)
The `Preset` contract is rendering-agnostic. To add a 3D effect later:
1. `npm i three @react-three/fiber @react-three/drei`.
2. Add a `<Scene3D>` sibling inside `.canvas`, mounted only when the active
   preset is flagged `kind: '3d'` (add an optional field to `Preset`).
3. A 3D preset's `build()` can return an empty/short timeline and instead drive
   the r3f scene via refs — the App/ControlPanel never change.
This keeps the 2D path untouched and the 3D path additive.

## LLM mood upgrade (safe last-hour swap)
Replace `parseMood(raw): MoodResult` with `async parseMoodAI(raw):
Promise<MoodResult>` calling an API route that returns the same JSON shape.
`generate()` becomes async; nothing else changes.
