# HEROTYPE — Tasks

Ordered for the 3h window (build order from the spec). Check off as you go.
`[x]` = done in the scaffolded framework, `[ ]` = verify / your turn.

## Build order
- [x] 1. Stage + hand-rolled split + **one** preset playing (safety net).
- [x] 2. Add the other five presets (rise, kinetic, wave, glitch, neon, drop).
- [x] 3. Mood parser (keyword) + mood chips.
- [x] 4. Sliders (speed/stagger/scale) + palette swatches.
- [x] 5. Copy-code stub (styled HTML).

## Acceptance criteria (VERIFIED 2026-06-06 via `npm run validate` — 7/7 green)
- [x] Typing in the headline field re-renders and re-animates live. (V1)
- [x] Each of the 6 presets plays a visibly distinct animation. (V2)
- [x] "Generate" on a mood phrase changes preset **and** palette **and** tagline. (V3)
- [x] Replay re-runs the current animation without a page reload. (V4)
- [x] Speed / stagger / scale sliders visibly affect the animation. (V5)
- [x] Copy-code writes a self-contained snippet to the clipboard. (V6)
- [x] Builds and deploys clean on Vercel. (V7 — built bundle, no console errors, mobile holds)

## Backlog (only if time remains)
- [ ] Swap keyword mood parser for an LLM call (`parseMoodAI`) — see plan.md.
- [ ] Three.js / r3f 3D preset behind the `Preset` contract — see plan.md.
- [ ] Real runnable export (full HTML + inlined GSAP timeline).
- [ ] Shareable URL state (encode `HeroState` in the query string).

## 2026-06-06 — Validation pass (V1–V7) — COMPLETE, 7/7 green
Ordered: harness first, then core-loop criteria, then the rest, fixes in-pass.
- [x] T1. Add `@playwright/test` devDep + install chromium. — `package.json`
- [x] T2. `playwright.config.ts`: webServer `build && preview` @ :4173, chromium, clipboard perms, screenshots dir. — `playwright.config.ts`, `.gitignore`
- [x] T3. Add minimal `data-testid` hooks only where selectors are brittle. — `src/components/*`, `src/App.tsx`
- [x] T4. Suite scaffold + global no-error guard (V7 errors). — `tests/validate.spec.ts`
- [x] T5. V1 — live headline (count + empty-safe).
- [x] T6. V3 — wow beat: Generate changes preset+palette+tagline; nonsense fallback.
- [x] T7. V6 — copy code reflects state + button confirms.
- [x] T8. V2 — 6 distinct presets + font + loop-stack guard + screenshots.
- [x] T9. V4 — replay clean.
- [x] T10. V5 — sliders + readouts + scale transform.
- [x] T11. V7 — first-paint timing + mobile layout / no h-scroll.
- [x] T12. Ran suite — **0 failures, no fixes needed**. The scaffold met every criterion first try.
- [x] T13. `npm run build` green; committing + pushing (auto-deploys); list updated to verified reality.

> Outcome: no defects found. `npm run validate` is now a reusable regression
> gate before each demo. Screenshots in `tests/__screenshots__/` (gitignored).
