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
- [x] DR1. Added `opentype.js` (runtime, dynamically imported → own chunk, 68KB gz)
  + `@types/opentype.js` devDep. — `package.json`
- [x] DR2. Types: `Preset.kind?: 'spans' | 'draw'`; `HeroState.drawFill: boolean`. — `src/lib/types.ts`
- [x] DR3. Bundled fallback face `public/fonts/anton.woff` (opentype-parseable; `.woff`
  not `.ttf` — matches the spike). — new asset
- [x] DR4. Added `draw` Preset (`kind:'draw'`, no-op `build` stub, font `"Anton"`). — `src/lib/presets.ts`
- [x] DR5. `HeroStage` refactored into a hook-free dispatcher → `SpansStage` (existing,
  byte-stable) | `DrawStage` (new). DrawStage: dynamic `import('opentype.js')`, parses
  bundled font, per-glyph `<path>` + `viewBox`/baseline, `useGSAP` strokes each
  `strokeDashoffset: len→0` (Speed/Stagger feed it). Empty-headline + load guards;
  scope revert cleans up. — `src/components/HeroStage.tsx`, `src/index.css`
- [x] DR6. `drawFill` in `INITIAL` (default `true`); per-char `fill-opacity 0→1` tween
  offset one stroke-duration so each glyph fills right after its outline. — `src/App.tsx`, `src/components/HeroStage.tsx`
  (`setDrawFill` + toggle UI deferred to Slice 3 where it's consumed.)
- [x] DR7. **Checkpoint PASSED.** `npm run build` green (opentype split to its own
  lazy chunk); `npm run validate` 9/9 (no regression from the refactor); manual
  drive of "Draw": 11 glyphs fully stroke→fill (dashoffset 0, fillOpacity 1),
  stroke=`--c1`, 0 console errors, screenshot reads clean. Committing (demoable).

### Slice 2 — Follow the picked font (full D2)
- [x] DR8. `src/lib/fontFiles.ts`: `fontFileUrl(family)` → jsDelivr `@fontsource`
  `.woff` (kebab id, latin, wght 400) + `familyName()` (strips CSS quotes) +
  `FONT_FILE_OVERRIDES` (empty — all 16 verified to follow the pattern) +
  `BUNDLED_FALLBACK`. — `src/lib/fontFiles.ts`
- [x] DR9. `DrawStage` resolves `state.font || familyName(def.font)`, fetches via
  `fontFileUrl`, falls back to bundled Anton on fetch/parse failure. — `src/components/HeroStage.tsx`
- [x] DR10. **Checkpoint PASSED.** Picking Pacifico/Montserrat/Oswald/Playfair with
  Draw active redraws in that face, 0 NaN, 0 console errors. `npm run build` +
  `npm run validate` 9/9 green. Committed `ad5cd1d`.
  - ⚠️ **Gotcha found & fixed:** `opentype.js` **2.0.0** emits `NaN` path coords for
    curved glyphs (Pacifico 11/11, Montserrat 8/11) and can't parse Oswald/Inter.
    **Pinned to 1.3.4** (0 NaN everywhere). DO NOT bump to 2.x.

### Slice 3 — Fill/outline toggle UI (full D4)
- [x] DR11. Fill/outline segmented toggle (`data-testid="draw-fill"`) in `ControlPanel`
  + `setDrawFill` in `App`, rendered only when active preset `kind==='draw'`. — `src/components/ControlPanel.tsx`, `src/App.tsx`, `src/index.css`
- [x] DR12. Verified both end states: Fill→fillOpacity 1, Outline→fillOpacity 0 with
  strokes fully drawn; toggle flips live; hidden off-draw. Screenshots clean.

### Slice 4 — Harness + ship
- [x] DR13. Added D1–D6 test (svg/path render + `.u`=0, font-follow path-`d` change +
  char-count, palette stroke recolour, fill/outline toggle, switch-away cleanliness,
  empty-headline safety). — `tests/validate.spec.ts`
- [x] DR14. `npm run validate` 10/10 green; `npm run build` green (opentype 1.3.4
  chunk 50KB gz).
- [x] DR15. Spec D1–D6 + this list updated to verified reality; committed.
  - ⏸️ **Push/deploy deferred** — a concurrent `align` feature was still in-progress
    in the shared files; combined green snapshot committed per user, NOT deployed
    until align is finished.

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
