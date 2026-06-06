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
