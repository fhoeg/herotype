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

## 2026-06-06 — Font override (F1–F6) — COMPLETE, 8/8 green
Feature already implemented; this verified it + fixed the one F2 gap.
- [x] FT1. F2 conformance fix: added `state.font` to `HeroStage` `useGSAP` deps so a font change re-animates. — `src/components/HeroStage.tsx`
- [x] FT2. Added font test (F1–F6) to the suite: default, apply+revert, on-demand `<link>`, list shape, export, sticky-across-preset+Generate. — `tests/validate.spec.ts`
- [x] FT3. `npm run validate` green (8 tests); `npm run build` green.
- [x] FT4. Spec criteria + this list updated to verified reality; committed + pushed (auto-deploys).

> Outcome: feature conforms to F1–F6. One gap found & fixed (F2 re-animate, 1 line).
> Suite is now 8 tests — the font test guards the override against regressions.

## 2026-06-06 — Draw-on effect (D1–D6) — PLANNED
Additive 7th effect ("Draw"): renders the headline as real glyph outlines via
`opentype.js` and animates each character's stroke on (GSAP-core dash-offset).
Build in escalating slices; **derisk WOFF2 first**. The whole feature sits below
the cut-list — drop it entirely if behind, the core loop + 6 presets are untouched.

### Slice 0 — Derisk the route (do FIRST, gate the rest)
- [x] DR0. **WOFF2 spike — GREEN.** jsDelivr `@fontsource` `.woff` files return
  200 + CORS `*` for all sampled curated fonts; `opentype.js` 2.0.0 `parse()` +
  `getPaths()` returns valid per-glyph SVG path `d` + advance widths across
  serif/script/display/pixel faces. **Route holds — we never touch `.woff2`.**
  Mechanism confirmed for slice 2: fetch `…/@fontsource/<id>/files/<id>-latin-400-normal.woff`
  → `opentype.parse(arrayBuffer)` → `font.getPaths(text, 0, baseline, size)`.

### Slice 1 — MVP draw (bundled font only → D1, D3, D5, D6 + reduced D2/D4)
- [ ] DR1. Add `opentype.js` dep (+ `@types/opentype.js` devDep if needed). — `package.json`
- [ ] DR2. Types: `Preset.kind?: 'spans' | 'draw'` (default spans); `HeroState.drawFill: boolean`. — `src/lib/types.ts`
- [ ] DR3. Add bundled fallback face `public/fonts/anton.ttf` (guaranteed-parseable). — new asset
- [ ] DR4. Add `draw` Preset (`kind:'draw'`, no-op `build` stub, font `"Anton"`). — `src/lib/presets.ts`
- [ ] DR5. `HeroStage` draw branch: async-load the **bundled** font (dynamic
  `import('opentype.js')`), compute per-glyph `<path d>` + `viewBox`/baseline,
  render `<svg>` of `<path fill="none" stroke="var(--c1)">`; `useGSAP` tweens each
  path `strokeDashoffset: len→0` staggered (Speed/Stagger feed it). Empty-headline
  & loading guards. Scope revert cleans up. — `src/components/HeroStage.tsx`
- [ ] DR6. Wire `drawFill` into `App` (`INITIAL` default `true`, `setDrawFill`); on
  draw completion tween `fill-opacity 0→1` iff `drawFill`. — `src/App.tsx`, `src/components/HeroStage.tsx`
- [ ] DR7. **Checkpoint:** `npm run build` green; "Draw" selectable, draws + replays
  cleanly, recolours with palette. Core loop still intact. Commit (demoable).

### Slice 2 — Follow the picked font (full D2)
- [ ] DR8. `src/lib/fontFiles.ts` (new): `fontFileUrl(family)` → jsDelivr `@fontsource`
  `.woff` URL (kebab id, `latin`, wght 400) + `FONT_FILE_OVERRIDES` map + bundled
  fallback constant. — `src/lib/fontFiles.ts`
- [ ] DR9. `HeroStage` resolves family from `state.font || def.font`, fetches via
  `fontFileUrl`, falls back to bundled `anton.ttf` on fetch/parse error (never
  blanks). Re-renders on `[preset, font, headline]`. — `src/components/HeroStage.tsx`
- [ ] DR10. **Checkpoint:** picking a Google Font with Draw active redraws in that
  face; a parse failure silently falls back. `npm run build` green; commit.

### Slice 3 — Fill/outline toggle UI (full D4)
- [ ] DR11. Fill/outline toggle (`data-testid="draw-fill"`) in `ControlPanel`,
  rendered **only** when active preset `kind==='draw'`; calls `setDrawFill`. — `src/components/ControlPanel.tsx`
- [ ] DR12. Verify both end states stable (fill solid vs. outline-only); toggle live. — eyeball + `src/components/HeroStage.tsx`

### Slice 4 — Harness + ship
- [ ] DR13. Add D1–D6 tests to the suite (svg/path render, font-follow path-`d`
  change, stagger readout, fill toggle, replay+switch cleanliness, palette stroke). — `tests/validate.spec.ts`
- [ ] DR14. `npm run validate` green; `npm run build` green.
- [ ] DR15. Update spec criteria (D1–D6) + this list to verified reality; commit + push (auto-deploys).

> Cut-list: if behind after slice 1, ship the bundled-font MVP and mark D2's
> font-following deferred. If `opentype.js` integration itself runs long, cut
> "Draw" — it's purely additive and never blocks the core loop or the wow beat.

## 2026-06-06 — Selectable colors (C1–C6)
State refactor first (prerequisite), then wiring, UI, verify.
- [x] CT1. `types.ts`: `Palette` gains `c3`; `HeroState` gains `colors:{canvas,c1,c2,c3}`; `palette` = highlight key (`''`=custom).
- [x] CT2. `palettes.ts`: hand-pick a `c3` secondary accent for each of the 5 palettes.
- [x] CT3. `presets.ts`: Glitch `-2px 0 #2af` → `-2px 0 var(--c3)`.
- [x] CT4. `App.tsx`: `INITIAL.colors`; delete palette `useEffect`; add `setColor`; `setPalette`/`generate` set `colors` from palette.
- [x] CT5. `HeroStage.tsx`: apply `--canvas/--c1/--c2/--c3` from `state.colors` at top of `useGSAP` (ordering fix); add colors to deps.
- [x] CT6. `ControlPanel.tsx` + `index.css`: 4 `<input type=color>` (font/effect1/effect2/bg) + "custom" tag; `--c3` default in `:root`.
- [x] CT7. `exportSnippet.ts`: read `state.colors` instead of `palettes[state.palette]`.
- [x] CT8. `tests/validate.spec.ts`: colors test (C1–C6).
- [x] CT9. `npm run validate` (9 tests) + `npm run build` green; commit + push (auto-deploys); mark verified.
