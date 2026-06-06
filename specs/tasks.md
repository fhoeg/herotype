# HEROTYPE — Tasks

Ordered for the 3h window (build order from the spec). Check off as you go.
`[x]` = done in the scaffolded framework, `[ ]` = verify / your turn.

## Build order
- [x] 1. Stage + hand-rolled split + **one** preset playing (safety net).
- [x] 2. Add the other five presets (rise, kinetic, wave, glitch, neon, drop).
- [x] 3. Mood parser (keyword) + mood chips.
- [x] 4. Sliders (speed/stagger/scale) + palette swatches.
- [x] 5. Copy-code stub (styled HTML).

## Acceptance criteria (verify in the running app)
- [ ] Typing in the headline field re-renders and re-animates live.
- [ ] Each of the 6 presets plays a visibly distinct animation.
- [ ] "Generate" on a mood phrase changes preset **and** palette **and** tagline.
- [ ] Replay re-runs the current animation without a page reload.
- [ ] Speed / stagger / scale sliders visibly affect the animation.
- [ ] Copy-code writes a self-contained snippet to the clipboard.
- [ ] Builds and deploys clean on Vercel.

## Backlog (only if time remains)
- [ ] Swap keyword mood parser for an LLM call (`parseMoodAI`) — see plan.md.
- [ ] Three.js / r3f 3D preset behind the `Preset` contract — see plan.md.
- [ ] Real runnable export (full HTML + inlined GSAP timeline).
- [ ] Shareable URL state (encode `HeroState` in the query string).
