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
