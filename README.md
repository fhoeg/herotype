# HEROTYPE

> Preset-driven generator that turns a **headline + a mood phrase** into an
> animated typographic website hero, with copy-to-clipboard export.

A 3-hour vibe-code hackathon PoC. Type a vibe ("playful & bouncy", "ominous,
cyberpunk") and the stage reconfigures effect, palette, timing, and tagline at
once. Six GSAP presets, five palettes, three tuning sliders.

## Stack
- **React 19 + Vite + TypeScript** — app shell
- **GSAP 3.12** (`@gsap/react` `useGSAP`) — all animation timelines
- CSS variables for theming — palette/preset swaps are one-liners
- Deployed on **Vercel** (static SPA, zero config)

Chosen over the single-file PoC so the framework can grow a **Three.js /
react-three-fiber** path later without a rewrite — see `specs/plan.md`.

## Run it
```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build to dist/
npm run preview    # preview the production build
```

## Project shape
```
src/
  App.tsx                 state, palette CSS vars, replay/copy
  components/
    HeroStage.tsx         hand-rolled split + useGSAP timeline
    ControlPanel.tsx      headline, mood, presets, sliders, swatches
  lib/
    presets.ts            6 effects — THE extension point
    palettes.ts           5 colour triples
    mood.ts               keyword mood parser (LLM-swappable)
    exportSnippet.ts      copy-to-clipboard HTML stub
    types.ts              Preset / Palette / MoodResult / HeroState
```

## Adding an effect
Drop one `Preset` object into `src/lib/presets.ts` — `{ name, desc, font,
weight, tracking, build(units, params) }` where `build` returns a GSAP
timeline. No component code changes.

## Spec-driven kit
Lightweight, in `specs/`:
- `constitution.md` — locked decisions, the fake-vs-real line, the cut list
- `herotype.spec.md` — the build spec (what & why)
- `plan.md` — spec → code module map, expansion paths
- `tasks.md` — ordered build tasks + acceptance criteria

Driven by three Claude Code slash commands: **`/specify`** → **`/plan`** →
**`/tasks`** (see `.claude/commands/`). Run `/tasks <feature> --build` to plan
and implement in one go.

The original reference PoC lives in `_material/`.
