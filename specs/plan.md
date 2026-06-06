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

---

# Plan — Validation pass (V1–V7)

Goal: prove the built app meets every criterion in the spec's *Validation pass*
section, fixing small/obvious gaps in-pass and flagging the rest. Verification
is an automated **Playwright** run against the production bundle.

## New files / changes
| Item | File | Purpose |
|---|---|---|
| Test runner config | `playwright.config.ts` | `webServer: npm run preview` on `:4173`, chromium project, grant clipboard permission, `outputDir` for traces. |
| Validation suite | `tests/validate.spec.ts` | One test per criterion V1–V7; asserts DOM/state, fails on `console.error`/`pageerror`, writes screenshots. |
| npm script | `package.json` | `"validate": "playwright test"`. |
| Screenshot output | `tests/__screenshots__/` (gitignored) | Human eyeball for motion quality (the part assertions can't judge). |
| App data hooks (only if needed) | `src/components/*` | Add `data-testid` / `data-active` attrs **only** where a selector is otherwise brittle. No behavioural change. |

## New dependency — justification
- **`@playwright/test`** as a **devDependency**. Not in the app bundle, not
  shipped, does not touch the LOCKED runtime tech (React/Vite/GSAP). The spec's
  "no new dependencies" rule governs the shipped app; a test harness is exempt.
  This is the only addition.

## Criterion → assertion map
| Crit | How it's checked |
|---|---|
| V1 | Fill `#headline`-equivalent input; assert `.u` count == non-space chars; clear it → stage still present, no crash. |
| V2 | Click each `.preset`; assert `.preset.active` is the clicked one + `h1` `font-family` changed; screenshot each. Switch rapidly ×6 then assert no `console.error` (loop-stacking guard). |
| V3 | Click chip "retro neon" → assert active preset `neon`, `getComputedStyle(:root)` `--c2` == neon's `#ff3df2`, tagline text changed, hint line updated. Then a nonsense phrase → assert a valid preset still active + `.u` count > 0. |
| V4 | Click replay → no error; `.u` still present; screenshot. |
| V5 | Set speed/stagger/scale via the range inputs; assert readout labels (`1.8×`, `80ms`, `1.3×`) and `.hero` inline `transform: scale(...)` for scale. |
| V6 | Grant clipboard perms; click copy; read `navigator.clipboard.readText()`, assert it contains the current headline + preset name; assert button shows `✓ copied`. |
| V7 | Collect console/page errors for the whole run → assert zero. Assert first `.u` visible < ~1s. Re-run at 390×844 → assert `.stage` and `.panel` both visible, no horizontal scroll (`scrollWidth <= clientWidth`). |

## Risks & mitigations
- **Animation timing makes pixel-diffs flaky** → screenshots are for human
  review only; no pixel assertions. State/DOM assertions are timing-tolerant
  (wait for elements/values, not for frames).
- **Clipboard in headless** → grant `clipboard-read`/`clipboard-write` via the
  Playwright browser context; Chromium supports `readText()` with permission.
- **Loop "stacking" is hard to assert directly** → proxy via "no console error
  after rapid preset switches" + the `useGSAP` revert invariant; deep-assert
  only if a visible defect shows in screenshots.
- **`vite preview` port** must match `baseURL` (4173).

## Smallest version that still closes the loop
If Playwright setup runs long, ship assertions for **V1 (headline) + V3
(Generate) + V6 (copy)** — the literal core loop — plus the global no-error
guard (V7), and eyeball V2/V4/V5 manually. This is the cut-list fallback;
everything else is additive.

---

# Plan — Font override (F1–F6)

The feature is **already implemented** in the working tree. This plan verifies
it against the spec and fixes the one gap found.

## Module map (as built)
| Concern | File | Notes |
|---|---|---|
| Curated list + lazy loader | `src/lib/fonts.ts` | `googleFonts` (~16 faces) + `loadGoogleFont(family)` injecting a `<link>` once per family. |
| State field | `src/lib/types.ts` | `HeroState.font: string` — `''` = preset default. |
| Picker UI | `src/components/ControlPanel.tsx` | `<select data-testid="font-select">`, options preview their own face, `onMouseEnter` preloads. |
| Live apply | `src/components/HeroStage.tsx` | `h1` font-family = `"${font}", ${preset.font}, serif` when set, else preset font. |
| Wiring + lazy fetch | `src/App.tsx` | `setFont` patches `font`; effect calls `loadGoogleFont(state.font)`. `setPreset`/`generate` leave `font` untouched (F6 sticky ✓). |
| Export | `src/lib/exportSnippet.ts` | Emits `"${font}", ${preset.font}` (preset fallback); preset-only when no override (F5 ✓). |

## Conformance check (spec → code)
- **F1 default** ✓ `font: ''`, picker reads "Preset default".
- **F2 applies live + re-animates** ⚠️ **GAP.** Font applies live (React
  re-render), but `font` is **not** in `HeroStage`'s `useGSAP` dependency array
  and `setFont` does not `replay()`, so the headline does not re-animate on a
  font change. **Fix (one line):** add `state.font` to the `useGSAP`
  dependencies in `HeroStage.tsx`, matching how headline/preset already trigger
  a re-run. No other file changes.
- **F3 on-demand** ✓ `loadGoogleFont` lazy + `onMouseEnter` preview; injects a
  `<link>` to `fonts.googleapis.com` only when a face is chosen/hovered.
- **F4 curated list** ✓ 16 distinct faces across serif/sans/display/mono/script.
- **F5 export** ✓ font carried into the snippet with preset fallback.
- **F6 sticky** ✓ `setPreset`/`generate` never write `font`; only the picker's
  "Preset default" clears it.

## Harness extension
Add **one test** to `tests/validate.spec.ts` (no new file, no new dep):
| Crit | Assertion |
|---|---|
| F1 | `font-select` value is `''`; first option label "Preset default"; default `h1` font-family contains the preset font. |
| F2 | `selectOption('Anton')` → `h1` font-family contains `Anton` **and** the preset fallback; selecting `''` reverts (no `Anton`). |
| F3 | After selecting, a `head link[href*="Anton"]` to `fonts.googleapis.com` exists (proves on-demand fetch). |
| F4 | `font-select` exposes > 10 options including a serif, a display, and a mono face. |
| F5 | Pick `Anton`, copy → clipboard contains `Anton`. |
| F6 | Pick `Anton`, switch preset to `wave`, then Generate "retro neon" → `h1` font-family still contains `Anton`. |

Re-animation (F2's motion half) is delivered by the one-line dependency fix;
the test asserts the **stable, observable** part (font applied/reverted). Motion
quality stays a screenshot/eyeball concern, consistent with the V-suite.

## New dependency
**None.** Google Fonts CSS is the same loading mechanism already used by
`index.html`; `@playwright/test` already present. Fully within LOCKED tech.

## Risks & mitigations
- **Async webfont load (FOUT)** → assert the inline/computed `font-family`
  *string* and the injected `<link>`, never rendered glyph pixels. Timing-tolerant.
- **`selectOption` vs React controlled `<select>`** → `selectOption` dispatches a
  native `change` that React's delegated listener picks up; reliable (same basis
  as the slider keyboard approach).

## Smallest version / cut-list
If time is short, ship **F2 (apply+revert) + F5 (export) + F6 (sticky)** — the
user-visible heart of the feature — and eyeball F1/F3/F4. The F2 one-line fix is
not optional (it's a spec conformance gap), but it's trivial.

---

# Plan — Draw-on effect (D1–D6)

Maps the spec's *Draw-on effect (self-drawing outlines)* section onto the code.
A 7th effect, **"Draw"**, that renders the headline as real glyph outlines
(via `opentype.js`) and animates each character's stroke on (manual
dash-offset, GSAP core). It is the first preset that **does not** run over the
`.u` spans — so it uses the `Preset` contract's sanctioned rendering-branch
extension (a `kind` flag), exactly parallel to the documented `kind:'3d'` path.

## The contract extension (keeps the invariant intact)
- Add optional `Preset.kind?: 'spans' | 'draw'` (default `'spans'`). The six
  existing presets stay `'spans'` and are **untouched**; their `(units, params)
  → timeline` contract is unchanged.
- `HeroStage` branches on `def.kind`: `'spans'` → today's split-text + `useGSAP`
  path; `'draw'` → the new SVG path renderer. This is the **one-time** component
  change the spec's decision #3 accepts; adding *future* span-presets still never
  touches component code.

## Module map (new + changed)
| Concern | File | Change |
|---|---|---|
| New effect entry | `src/lib/presets.ts` | Add `draw` Preset: `{ key:'draw', name:'Draw', desc:'ink · outline', kind:'draw', font:'"Anton"', weight:400, tracking:'-0.01em', build: () => gsap.timeline() }`. `build` is a no-op stub (HeroStage drives the SVG); kept so the type/array stay uniform. |
| Type extensions | `src/lib/types.ts` | `Preset.kind?: 'spans' \| 'draw'`; `HeroState.drawFill: boolean` (true = fill solid after draw, false = outline-only end state, D4). |
| Font-binary resolver | `src/lib/fontFiles.ts` **(new)** | `fontFileUrl(family): string` → jsDelivr `@fontsource` **`.woff`** URL (opentype-parseable; **not** `.woff2`), derived from the family (kebab id, `latin`, weight `400`), with a `FONT_FILE_OVERRIDES` map for non-conforming faces and a bundled-fallback constant. |
| Bundled fallback face | `public/fonts/anton.ttf` **(new asset)** | One guaranteed-parseable TTF so the effect never blanks if a fetch/parse fails. |
| SVG draw renderer + draw timeline | `src/components/HeroStage.tsx` | New `kind==='draw'` branch: async-load the font, compute per-glyph `<path d>` + `viewBox`/baseline, render an `<svg>` of `<path fill="none" stroke="var(--c1)">`, then a `useGSAP` timeline tweens each path's `strokeDashoffset: len→0` with `stagger` (Speed/Stagger feed it like other presets); on completion, tween `fill-opacity 0→1` iff `drawFill`. Scope revert handles cleanup. |
| Fill/outline toggle | `src/components/ControlPanel.tsx` | A small two-state toggle (`data-testid="draw-fill"`) rendered **only** when the active preset's `kind==='draw'`; calls `setDrawFill`. |
| Wiring | `src/App.tsx` | `drawFill` in `INITIAL` (default `true`); `setDrawFill` passed to both components. Existing `setPreset`/`generate`/`setFont` unchanged. |
| Export | `src/lib/exportSnippet.ts` | *(Optional, last)* for the draw preset emit an outlined-text note in the stub; otherwise leave as-is. Low priority — export stays a stub. |

## State / data flow for the draw branch
`[state.preset, state.font, state.headline]` → **load effect**: resolve family
(`state.font || def.font`) → `fontFileUrl` → `await import('opentype.js')` +
`opentype.load(url)` → `font.getPaths(text, …)` → set `glyphs:{d}[]` + `box` in
local state. **Draw effect** (`useGSAP`, scope = the SVG wrapper, deps
`[glyphs, speed, stagger, drawFill, runId]`): set each path's
`strokeDasharray/Offset` from `getTotalLength()`, tween offset→0 staggered, then
fill if `drawFill`. Loading shows nothing (or the prior frame) — no crash on
empty headline (guard `glyphs.length`).

> **Lazy-load `opentype.js`** via dynamic `import()` inside the load effect, so
> it ships in a separate chunk and the core-loop bundle/first-paint stays fast.

## New dependencies — justification
- **`opentype.js`** (runtime). The constitution's LOCKED list bans *premium GSAP
  plugins, three.js, shaders/WebGL* — a font-parsing library is none of these,
  and the draw animation itself is **GSAP core only** (dash-offset). This is the
  route the spec's decision #1 explicitly chose. Dynamically imported, so it is
  off the initial-load critical path.
- **`@types/opentype.js`** (devDependency) if the package's bundled types are
  insufficient.
- No DrawSVG, no SplitText, no WebGL. The bundled `.ttf` is a static asset.

## Risks & mitigations
- **WOFF2 unparseable (the flagged risk).** Google's `gstatic` serves `.woff2`,
  which opentype.js can't decode. → Fetch **`.woff`** from jsDelivr `@fontsource`
  (CORS `*`, opentype-parseable). Per-family URL is deterministic; exceptions go
  in `FONT_FILE_OVERRIDES`. If fetch/parse throws → fall back to the bundled
  `anton.ttf`, so the headline always draws (in the fallback face). **This is the
  one risk that can sink the chosen route — derisk it first (see tasks).**
- **Async load race / FOUT-equivalent.** Guard on a `glyphs` ready-state; revert
  the prior SVG before rendering new paths; `useGSAP` scope revert kills stale
  dash tweens.
- **Variable fonts / missing weight 400 on fontsource** → override map + bundled
  fallback cover it.
- **Sizing parity** with span presets (centering, responsive type) → size the
  `<svg>` by `viewBox` + CSS `max-width`/clamp; visual parity is approximate and
  acceptable (no pixel assertions, per the V-suite convention).
- **Bundle weight** → dynamic import keeps `opentype.js` out of the main chunk.

## Harness extension
Add tests to `tests/validate.spec.ts` (no new file, no new dep):
| Crit | Assertion |
|---|---|
| D1 | Select "Draw" → an `<svg>` with `path[stroke]` renders in the stage (distinct from `.u` spans); screenshot for the motion eyeball. |
| D2 | Pick font `Pacifico` with Draw active → the rendered `<path>` `d` changes vs. default face (proves it follows the font); edit headline → path count tracks the new char count. |
| D3 | Raise Stagger → assert the readout label; motion pacing is a screenshot eyeball. |
| D4 | Toggle `draw-fill` → assert paths' `fill-opacity` (or `fill`) flips between drawn-solid and outline-only. |
| D5 | Replay with Draw active → no `console.error`; switch to `rise` and back → exactly one `<svg>`, no orphaned paths. Empty headline → no crash. |
| D6 | Assert path `stroke` resolves to the palette `--c1`/`--c2` var; switch palette → stroke recolours. |

## Smallest version that still closes the loop
The whole feature is **additive** — the core loop and the existing 6 presets +
font picker are untouched, so "Draw" can be cut entirely without harming the
demo (it sits *below* the constitution cut-list, which only trims down to 4
presets). Build it in escalating slices:
1. **MVP draw** — "Draw" renders + animates using the **bundled `anton.ttf`
   only** (ignore the picker), fill end-state, paced by Speed/Stagger,
   palette-coloured, clean replay. Satisfies D1, D3, D5, D6 and a reduced D2/D4.
2. **+ Follow the font** — per-family fetch via `fontFiles.ts` (full D2).
3. **+ Fill/outline toggle** — `drawFill` UI (full D4).
Ship 1, then 2, then 3; stop wherever time runs out. **Derisk WOFF2 first** — if
no parseable font source works in-browser within the spike, fall back to the
bundled-font-only MVP (slice 1) and note that D2's font-following is deferred.

---

# Plan — Selectable colors (C1–C6)

Make the 5-palette row tunable: four color inputs (font / effect 1 / effect 2 /
background), palettes seed them, a tweak goes "Custom". Adds a secondary accent
`--c3` (Glitch's currently-hardcoded blue).

## State model (the key decision)
`HeroState` becomes color-driven instead of palette-key-driven:
- **Add** `colors: { canvas; c1; c2; c3 }` — the **source of truth** for
  rendering and export.
- **Keep** `palette: string` for the swatch highlight only: the active key, or
  `''` when the user has tweaked a channel ("Custom"). Not read for rendering.

`INITIAL.colors` = the `ember` palette (+ its new `c3`); `palette: 'ember'`.

## Module map (changes)
| File | Change |
|---|---|
| `src/lib/types.ts` | `Palette` gains `c3`. `HeroState` gains `colors:{canvas,c1,c2,c3}`; `palette` repurposed as highlight key (`''`=custom). |
| `src/lib/palettes.ts` | Add a hand-picked `c3` secondary accent to each of the 5 palettes (resolved decision). |
| `src/lib/presets.ts` | **Glitch** only: replace the hardcoded `-2px 0 #2af` with `-2px 0 var(--c3)`. No other preset changes. |
| `src/components/ControlPanel.tsx` | In the Palette section, add 4 `<input type="color">` (testids `font-color`, `effect-color-1`, `effect-color-2`, `bg-color`) bound to `state.colors.*`; keep the 5 swatches. Show "Custom" when `palette===''`. |
| `src/App.tsx` | `setColor(channel,value)` → patch `colors`, set `palette:''`, `replay()`. `setPalette(key)` → set `colors` from palette + `palette:key` + `replay()`. `generate()` → set `colors` from the mood's palette (+key). |
| `src/components/HeroStage.tsx` | **Apply the CSS vars here** (see ordering fix) from `state.colors`, then build; add `state.colors` to the `useGSAP` deps. |
| `src/lib/exportSnippet.ts` | Read `state.colors` (not `palettes[state.palette]`); emit real `canvas/c1/c2`; mention `c3` in the Glitch TODO comment. |

## Ordering fix (correctness, not cosmetic)
Today the palette CSS vars are written in an `App` `useEffect`. Effects flush
**child-before-parent**, so `HeroStage`'s `useGSAP` (child) runs *before* `App`'s
var-writing effect (parent) — meaning a baked-color effect (Glitch shadow, Neon
glow, both read `var(--c2)` at build time) would rebuild against the **stale**
color. Fix: move the `setProperty('--c1'|'--c2'|'--c3'|'--canvas', …)` calls to
the **start of `HeroStage`'s `useGSAP` callback**, before `def.build(...)`, so
fresh colors are always in place when the timeline is constructed. This also
deletes `App`'s palette `useEffect`. Live, non-baked colors (font `--c1`,
`--canvas` background) update via the same path on the same `replay()`.

## New dependency
**None.** Native `<input type="color">`, existing CSS-variable theming, existing
`@playwright/test`. Fully within LOCKED tech.

## Criterion → assertion map (extend `tests/validate.spec.ts`, one new test)
| Crit | Assertion |
|---|---|
| C1 | Four color inputs present by testid, each with a hex value. |
| C2 | Click `ink` palette → inputs reflect its hex + `.sw[data-palette=ink]` active; then `font-color.fill('#00ff88')` → no `.sw.active` (Custom) and `:root --c1` == `#00ff88`. |
| C3 | `bg-color.fill('#123456')` → `getComputedStyle(:root) --canvas` == `#123456`; `effect-color-1.fill(...)` → `--c2` matches. |
| C4 | Select Glitch; `effect-color-2.fill('#00ffff')` → `:root --c3` == `#00ffff` (var asserted; running-tween color is eyeball/screenshot). |
| C5 | Set a custom bg, copy → clipboard contains that hex. |
| C6 | Fresh load → `:root --c1` == ember `#f4f1ea`; Generate still sets a full palette (`--c2` == the mood palette's value, as V3 already checks). |

## Risks & mitigations
- **Effect-run ordering** → addressed above (apply vars inside `HeroStage`).
- **`<input type="color">` value format** → browsers normalise to lowercase
  `#rrggbb`; assert against lowercase hex, and store palette hexes lowercase.
- **`fill()` on color inputs** → Playwright sets `.value` + fires `input`; React
  `onChange` picks it up (same basis as the slider/select paths).
- **Regression surface** → every read of `state.palette` for *rendering/export*
  must move to `state.colors`; grep for `palettes[` and `state.palette` to catch
  them. V3's `--c2`-after-Generate assertion guards the Generate path.

## Smallest version / cut-list
If behind: ship **C1+C2+C3** (font/bg/effect-1 pickers, palette-seed, live
recolor) and **C5/C6** (export + no-regression, both cheap); **defer C4** — leave
Glitch's second channel as its fixed blue and skip `--c3`. The state refactor is
the prerequisite for all of them, so it is not cuttable.
