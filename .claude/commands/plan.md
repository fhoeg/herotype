---
description: Turn a spec into a concrete implementation plan mapped onto the codebase
argument-hint: [feature or spec file]
---

You are running the **plan** step of HEROTYPE's lightweight spec-driven kit.

Read in order: `specs/constitution.md`, the relevant `specs/*.spec.md`, and the
current `specs/plan.md` (the module map and architecture invariants).

For: **$ARGUMENTS** (default: whatever spec changed most recently)

1. Map the spec onto concrete files using the module map in `specs/plan.md`.
   Reuse existing extension points — an effect is a `Preset` object, a mood
   change is a `MoodResult`. Adding either must not touch component code.
2. Call out any new dependency and justify it against the constitution's LOCKED
   tech. During the 3h window, default to **no new deps**.
3. Note risks, the cut-list fallback, and the smallest version that still
   closes the core loop.
4. Update `specs/plan.md` with the resulting module/state changes.

Keep it lean and buildable in the time left. Next step: `/tasks`.
