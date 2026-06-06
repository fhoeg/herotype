# HEROTYPE — Build Spec

> Preset-driven generator that turns a **headline + a mood phrase** into an animated
> typographic website hero, with copy-to-clipboard export.
> **It is a generator with tuning, not an editor.** Context: a 3-hour vibe-code hackathon.
> Optimize for demo wow-per-hour and a closeable core loop.

A working proof-of-concept exists (`hero-type-poc.html`). This spec describes the target build; use the PoC as a reference for feel and for the GSAP timelines.

---

## Core loop (must work)

```
type headline → type mood → Generate → hero animates instantly
            → nudge 2–3 sliders → copy code
```

If this loop closes end-to-end, the demo lands. Everything else is secondary.

## The wow beat

The **mood prompt**. Typing "playful & bouncy" reconfigures the whole stage at once —
effect, palette, timing, and tagline. Lead the live demo with this, not the sliders.

---

## Tech — LOCKED, do not reopen

- **GSAP 3.12 core** (CDN) + **CSS**. Nothing else.
- **No** three.js, **no** shaders, **no** premium GSAP plugins (no SplitText).
- Split text into per-character `.u` spans **by hand**; wrap each word in a `.word`
  span so line-wrapping still works. Insert explicit space units between words.
- No build step. Single self-contained `index.html` is acceptable.

This is the single most important scope decision. Keeping rendering paradigms open is
what kills a 3-hour build.

---

## Features

### Presets (6)
Each preset = `{ name, desc, font, weight, tracking, build(units, params) }` where
`build` returns a GSAP timeline.

| key      | name    | vibe              | technique (summary)                                |
|----------|---------|-------------------|----------------------------------------------------|
| rise     | Rise    | editorial · clean | yPercent up + blur fade, `power3.out`              |
| kinetic  | Kinetic | bold · punchy     | scale 0→1 + random rotation, `back.out(2.2)`       |
| wave     | Wave    | liquid · calm     | rise in, then infinite yoyo sine bob               |
| glitch   | Glitch  | cyber · heavy     | x-jitter + skew in, looping RGB text-shadow shift  |
| neon     | Neon    | retro · synth     | random-order fade with glow + flicker yoyo         |
| drop     | Drop    | elastic · playful | yPercent from above, `elastic.out(1,0.45)`         |

Curated presets beat a blank canvas and demo faster. Each carries its own font
personality (e.g. Fraunces, Archivo Black, Space Mono, Bricolage Grotesque).

### Mood parser
Maps a free-text phrase to `{ preset, palette, speed, tagline }`.

- **Ship the keyword-matcher first** (buckets of keywords → settings). Zero dependencies,
  works offline, demos identically to an AI version.
- **Then, only if time remains**, swap in a real LLM call that returns JSON params.
  The interface is identical, so this is a safe last-hour upgrade — **not** a dependency.
- Keyword buckets to seed: ominous/cyber/glitch/heavy → glitch; neon/retro/80s/synth →
  neon; playful/bouncy/fun → drop; elegant/luxury/editorial/minimal → rise;
  liquid/smooth/organic/calm → wave; bold/loud/impact/sport → kinetic.
- Provide a few clickable mood **chips** as starting points.

### Tuning (3 sliders only)
`speed` (0.4–2.2×), `stagger` (0–120ms), `scale` (0.6–1.6×). Resist adding more —
each control is preview-wiring you must maintain.

### Palettes (5)
`{ canvas, c1, c2 }` triples driven by CSS variables. Switching = a few `setProperty`
calls. Suggested: ember, cyber, neon, cream, ink.

### Export — build LAST
Copy-to-clipboard. A **styled HTML stub** (markup + inline styles + a TODO comment
for the timeline) is enough for judging. A real runnable export pipeline is an
invisible time sink; do not build it unless everything else is done.

---

## Build order (3h)

1. **(~45 min)** Stage + hand-rolled split + **one** preset playing. This is the safety net — get something moving early.
2. Add the other five presets.
3. Mood parser (keyword version) + mood chips.
4. Sliders + palette swatches.
5. Copy-code stub **last**.

## Fake-vs-real (decided up front)

- **Fake:** LLM mood-parsing (use keywords), code export (styled stub), any 3D/shader
  look (use CSS transforms + blend modes + glow).
- **Real:** the six animations, the live preview, the mood→preset reconfiguration.

## Cut list (if behind, in order)

1. Drop to 4 presets
2. Drop palette switching
3. Drop the scale slider

**Never cut:** headline input · one working animation · the mood Generate beat.

---

## Acceptance criteria

- [ ] Typing in the headline field re-renders and re-animates live.
- [ ] Each of the 6 presets plays a visibly distinct animation.
- [ ] "Generate" on a mood phrase changes preset **and** palette **and** tagline together.
- [ ] Replay re-runs the current animation without a page reload.
- [ ] Speed / stagger / scale sliders visibly affect the animation.
- [ ] Copy-code writes a self-contained snippet to the clipboard.
- [ ] Runs from a single file with no build step; GSAP from CDN.

## Stack notes for the agent

- GSAP core only: `gsap.timeline()`, `gsap.from/to`, `gsap.utils.random`, `stagger`
  (including `{ each, from:'random', yoyo, repeat }`).
- Kill prior tweens before replay (`tl.kill()` + `gsap.killTweensOf('.u')`) to avoid
  stacked animations.
- Theme everything through CSS variables (`--c1`, `--c2`, `--canvas`, `--display`,
  `--font-weight`, `--tracking`) so palette/preset swaps are one-liners.
- Use `text-wrap: balance` on the headline; `clamp()` for responsive type size.
- Keep `will-change: transform, opacity, filter` on `.u` units.

---

# Validation pass — demo-ready baseline

> The framework is scaffolded and the core loop is wired. This pass does **not**
> add features — it proves the built product satisfies every acceptance
> criterion against the *running app* and fixes any gap, so the demo is
> rehearsable and trustworthy. **Why now:** lock the baseline before any
> LLM / 3D / share-URL work can destabilise it.

## What "validated" means (user-visible)
A presenter can sit down at the live URL and, with no console errors, perform
the full core loop and every individual control, each behaving exactly as
described — first try, every try, on a clean reload.

## Validation criteria (each must PASS, with the observed failure mode noted if not)

- [ ] **V1 — Live headline.** Editing the headline field re-renders the split
  text and re-runs the current animation on every change, with no leftover
  characters, stacked/ghost glyphs, or layout jump. An empty field does not
  crash or collapse the stage.
- [ ] **V2 — Six distinct effects.** Selecting each preset (Rise, Kinetic,
  Wave, Glitch, Neon, Drop) plays a *visibly different* animation and applies
  that preset's font. Looping effects (Wave bob, Glitch jitter, Neon flicker)
  run continuously without piling up after repeated switches.
- [ ] **V3 — The wow beat.** "Generate" (and each mood chip) changes preset
  **and** palette **and** tagline **together** in one beat, and the hint line
  reflects the result. A nonsense phrase still yields a valid, animated result
  (graceful fallback), never a blank stage.
- [ ] **V4 — Replay.** "↻ replay" re-runs the current animation from the top
  without a page reload and without leaving the previous run's tweens alive.
- [ ] **V5 — Tuning sliders.** Speed, Stagger, and Scale each produce a visible,
  correct change, and their readouts (×, ms, ×) track the value.
- [ ] **V6 — Copy code.** "⧉ copy code" writes a self-contained snippet to the
  clipboard reflecting the *current* headline, preset, palette, and tagline,
  and the button confirms ("✓ copied").
- [ ] **V7 — Clean load & deploy.** Production URL loads with no uncaught
  console errors; fonts and the initial animation appear within ~1s; the layout
  holds on a narrow (mobile) viewport.

## Scope corrections vs. the original spec
The original criteria assumed the single-file/CDN PoC. For this build they are
restated to match the locked React + Vite stack:
- ~~"Runs from a single file, GSAP from CDN"~~ → **V7**: runs as the built Vite
  app, GSAP bundled, deploys clean on Vercel. *(This supersedes the old single-
  file criterion; the constitution's React+Vite decision governs.)*
- Replay/cleanup is verified through behaviour (no stacking), not by asserting a
  specific `kill()` call — `useGSAP` scope revert is the sanctioned mechanism.

## Out of scope (do NOT do during this pass)
- No new effects, palettes, sliders, or copy. No LLM mood parser. No 3D.
- No restyle/redesign. Cosmetic polish only if it is fixing an outright defect
  surfaced by a criterion (e.g. a layout break), nothing aesthetic-for-its-own-sake.
- No new dependencies.

## Done when
All of V1–V7 are checked, any fix is committed and redeployed, and the
`specs/tasks.md` acceptance list is updated to reflect verified reality.

## Decisions (resolved)
1. **Verification method → automated browser pass.** Playwright as a dev-only
   dependency drives the loop and every control, asserts DOM/state (split counts,
   palette CSS vars, clipboard text), captures screenshots for human review, and
   fails on any `console.error`. Runs against `vite preview` locally.
2. **Bug-fix latitude → fix small/obvious in-pass, flag the rest.** A failing
   criterion gets fixed immediately when the fix is small and obviously correct;
   anything ambiguous or design-ish is logged and surfaced for triage, not
   silently changed.

> Note: Playwright is a **dev/test dependency**, not shipped runtime code — it
> does not breach the "no new dependencies" out-of-scope rule, which governs the
> app bundle.

---

# Font override

> A picker that swaps the active preset's typeface for one of a curated set of
> Google Fonts, or reverts to the preset's own font. **Why:** the six presets
> ship one font personality each; letting the user retype the hero in a
> different face — Anton, Pacifico, Press Start 2P — multiplies the looks they
> can land on for "their own website" at near-zero cost, and makes the
> copy-code output match what they see. It is **tuning, not the wow beat** — the
> mood Generate beat still leads the demo; this is a secondary control.

## What the user sees
A "Font" control in the panel, near the effect/tuning controls. It lists
**"Preset default"** (selected initially) plus a curated set (~16) of
distinctive Google Fonts. Picking one re-renders the headline in that face and
re-runs the current animation; picking "Preset default" returns to the preset's
own typeface. Only the *font family* changes — weight, tracking, palette, and
the animation itself are untouched.

## Acceptance criteria (VERIFIED 2026-06-06 via `npm run validate` — 8/8 green)
- [x] **F1 — Default is the preset font.** With no override chosen, every preset
  renders in its own typeface exactly as before this feature existed; the
  control reads "Preset default".
- [x] **F2 — Override applies live.** Choosing a font immediately re-renders and
  re-animates the headline in that font; choosing "Preset default" reverts to
  the active preset's font. No page reload. *(Required adding `font` to the
  HeroStage `useGSAP` deps so the change re-animates — done.)*
- [x] **F3 — Loaded on demand.** Fonts are not all fetched up front; a font is
  fetched when it's chosen (or previewed) and applies without a manual reload. A
  brief unstyled-text flash on first use is acceptable.
- [x] **F4 — Curated, legible list.** The list is a hand-picked set of visually
  distinct faces (serif / sans / display / mono / script), each shown so the
  user can tell them apart, with no broken or unavailable entries.
- [x] **F5 — Export reflects it.** Copy-code emits the chosen font in the
  snippet's `font-family`, with the preset font kept as a fallback; "Preset
  default" emits just the preset font.
- [x] **F6 — Override is sticky.** An explicit font persists when the user
  switches presets and when they click Generate; it clears only when the user
  picks "Preset default". (See resolved decisions.)

## Out of scope
- No font **weight / style / size** controls — weight & tracking stay owned by
  the preset. No per-character font mixing.
- No **arbitrary** Google Fonts search or custom/uploaded fonts — curated list only.
- No **persistence** across reloads (belongs to the future share-URL feature).
- The export stays a **styled stub**; it does not also inject the `@import`/`<link>`
  for the font (a TODO comment is enough), consistent with the export's existing scope.

## Decisions (resolved)
1. **Preset switch keeps the override.** Choosing an effect does **not** reset
   the font; the user's chosen typeface persists across preset switches. Font is
   an independent, user-owned control. *(Matches current implementation.)*
2. **Generate keeps the override.** The mood beat reconfigures effect + palette
   + timing + tagline only; it leaves the font untouched. *(Matches current
   implementation.)*

> Both decisions confirm the existing behaviour — no behavioural change needed.
> "Preset default" is the single explicit reset path. This is the F6 criterion.

---

# Draw-on effect (self-drawing outlines)

> A new effect that reveals the headline as if a pen were **tracing each
> letter's outline** on the canvas — strokes draw on progressively, character
> by character. **Why:** it is the most "wow" motion idiom missing from the set
> (the other six fill/move/glow; none *draws*), it reads instantly on a stage,
> and because it traces the *actual selected typeface* it compounds the value of
> the font picker — every Google Font becomes a hand-drawn reveal. It is a
> **new effect (a 7th look), not a new wow beat** — the mood Generate beat still
> leads the demo. **Is it possible?** Yes: the headline is rendered as vector
> outlines of the current font and each outline's stroke is animated from hidden
> to fully drawn (dash-offset), with a per-character stagger — no premium GSAP
> plugin and no WebGL required.

## What the user sees
A new entry in the **Effect** list (working name **"Draw"**). Selecting it shows
the headline as outlined letterforms that draw themselves on — each character's
stroke is revealed in sequence, like ink laid down by a pen — and then settles
into a readable headline. It traces the **currently selected font's** glyph
shapes, so switching font or editing the headline re-renders and re-draws. The
existing Speed and Stagger sliders pace the draw exactly as they pace the other
effects; the palette drives the stroke (and fill) colours. Replay re-draws from
blank. Switching to any other effect returns to the normal rendering with no
leftover strokes.

## Acceptance criteria
- [ ] **D1 — It draws.** Selecting "Draw" reveals the headline by progressively
  tracing the letterforms' outlines (stroke drawing on from nothing to complete),
  not by fading or moving filled glyphs. The result is visibly distinct from all
  six existing effects.
- [ ] **D2 — Follows the font + headline.** The drawn shapes are the *current*
  font's glyph outlines (preset default or a picked Google Font); changing the
  font or editing the headline re-renders and re-draws cleanly, with no stale
  characters.
- [ ] **D3 — Per-character pacing.** Characters draw on in reading order with a
  stagger, and the Speed and Stagger sliders visibly change how fast and how
  tightly spaced the draw is — consistent with the other effects.
- [ ] **D4 — Readable end state, user's choice.** When the draw completes the
  headline is left in a clean, legible state and stays put — no flicker, no
  half-drawn glyphs. A small **fill / outline** toggle (shown when "Draw" is the
  active effect) lets the user pick whether glyphs fill solid after drawing or
  remain outline-only; both end states are stable.
- [ ] **D5 — Clean replay & switch.** Replay re-runs the draw from blank without
  a reload; switching to another effect and back leaves no stacked or orphaned
  strokes; an empty headline does not crash the stage.
- [ ] **D6 — Palette-themed.** Stroke (and any fill) colours come from the active
  palette's CSS variables, so palette swaps recolour the effect like the others.

## Out of scope
- **Not handwriting / stroke-order calligraphy.** This traces glyph *outlines*
  progressively; it does not replicate the natural pen path or stroke order a
  human would use. No script-font "cursive join" simulation.
- **No premium GSAP plugins.** The draw is achieved with the core library only
  (manual stroke dash-offset), per the constitution — no DrawSVG, no SplitText.
- **No WebGL / shaders / 3D** (constitution-locked).
- **No new effect-specific UI controls beyond the fill/outline toggle** (no pen
  width, draw direction, etc.) — it otherwise reuses the existing Speed/Stagger
  sliders only.
- **Export stays a styled stub.** Copy-code need not reproduce the draw timeline;
  the existing TODO-comment scope holds.

## Decisions (resolved)
1. **Technique → real glyph paths via `opentype.js`.** Parse the actual font to
   extract true per-glyph vector contours and animate their stroke on. This adds
   `opentype.js` as an **accepted runtime dependency** (the constitution bans
   premium GSAP plugins, three.js, shaders/WebGL — a font-parsing library is
   none of those). The draw itself still uses **GSAP core only** (manual stroke
   dash-offset), no DrawSVG.
2. **End state → user-selectable.** A **fill / outline** toggle (visible only
   when "Draw" is active) lets the user choose whether glyphs fill solid after
   drawing or stay outline-only. Both are stable end states (D4).
3. **Architecture → accept a one-time SVG render branch.** This effect renders an
   SVG glyph-path layer instead of the `.u` spans, extending the stage component
   once. This is the sanctioned extension the `Preset` contract already
   anticipates ("a preset can drive a sibling canvas/SVG scene"); other presets
   are untouched and the `(units, params) → timeline` contract still holds for
   them.
4. **Mood mapping → selectable-only for now.** "Draw" is chosen from the Effect
   list; no mood keyword maps to it in this pass (a "sketch/handdrawn/ink"
   keyword can be added later if time allows).

## Flagged risk for `/plan` (not a spec decision)
- **WOFF2 parsing.** Google Fonts serves `.woff2` by default, which `opentype.js`
  cannot parse without a Brotli/WASM decompressor. The plan must choose how to
  obtain a parseable font (e.g. request a `.ttf`/`.woff` variant, bundle a WASM
  decompressor, or restrict "Draw" to fonts available in a parseable format) and
  define the fallback when a font cannot be parsed. This is the main
  feasibility/time risk for the chosen route.

---

# Selectable colors

> Turn the fixed 5-palette swatch row into a tunable color system: the user
> picks the **font color**, **two effect/accent colors**, and the **background
> color** directly, with the palettes kept as one-click starting points.
> **Why:** color is the other half (with font) of making a hero feel like
> *their* brand. Five palettes cover moods; direct pickers let someone match a
> client's exact hex in seconds — and make the copy-code output paste-ready for
> a real site. It is **tuning, not the wow beat**; the mood Generate beat (which
> still sets a whole palette at once) leads the demo.

## What the user sees
The palette section keeps the 5 swatches as quick presets, and gains four
labelled color inputs: **Font color**, **Effect color 1**, **Effect color 2**,
**Background**. Clicking a palette swatch fills all four from that palette.
Editing any input recolors the stage immediately. Once a value diverges from
the active palette, the palette row shows no swatch selected (the state is
"Custom"). Copy-code emits the exact colors on screen.

The colors map onto the existing theme variables: font color → `--c1`, effect
color 1 → `--c2`, background → `--canvas`. **Effect color 2 is new** (`--c3`): a
secondary accent for effects that use two colors — today only **Glitch**, whose
second RGB-shadow channel is currently a hardcoded blue.

## Acceptance criteria (VERIFIED 2026-06-06 via `npm run validate` — 9/9 green)
- [x] **C1 — Four pickers.** Font color, Effect color 1, Effect color 2, and
  Background are each a color input showing the current value as a hex/swatch.
- [x] **C2 — Palettes seed, then go Custom.** Clicking a palette sets all four
  channels from it and marks that palette active; editing any channel clears the
  active-swatch highlight (the state is now custom). The 5 palettes still work
  one-click.
- [x] **C3 — Live recolor.** Changing the font, background, or an effect color
  updates the stage immediately, including effects whose color is baked at
  build time (e.g. Glitch shadow, Neon glow) — those re-run so the new color
  shows, with no page reload.
- [x] **C4 — Second accent is wired.** Effect color 2 controls the second color
  channel of multi-color effects (Glitch's dual shadow), replacing the previous
  fixed value; single-accent effects simply ignore it.
- [x] **C5 — Export reflects real colors.** Copy-code emits the actual current
  background, font, and accent color(s) used by the look — not a palette name —
  so the pasted snippet matches the screen.
- [x] **C6 — No regression at default.** On first load the initial palette
  renders pixel-for-pixel as before; the Generate beat still applies a full
  palette (all channels) in one action.

## Decisions (resolved)
1. **Palettes seed the pickers.** The 5 palettes remain as one-click presets
   that fill the pickers; state holds the actual colors, and a manual tweak puts
   the UI in a "Custom" (no active swatch) state. Palette = a preset that sets
   colors, not the source of truth.
2. **Two accent colors.** Expose effect color 1 (`--c2`) plus a new secondary
   accent (`--c3`). The palette presets gain a sensible secondary value; Glitch
   uses `--c3` for its second channel. (A future effect may use `--c3` too.)

## Out of scope
- No **gradients**, **alpha/opacity**, or per-character colors — solid colors only.
- No **saving / naming** custom palettes, and no **persistence** across reload
  (that belongs to the future share-URL feature).
- No automatic **contrast / accessibility** checking or "readable text" warnings.
- `--c3` is only consumed where an effect genuinely uses two colors (Glitch in
  this pass); retrofitting other effects to a second accent is a later option.

## Open question for `/plan` (not user-blocking)
- Whether each palette preset's new secondary accent (`--c3`) is hand-picked per
  palette or derived (e.g. a hue shift of `--c2`). Default if unaddressed:
  hand-pick one secondary per palette so the presets stay curated.
