---
description: Break the current plan into an ordered, checkable task list and (optionally) start building
argument-hint: [feature] [--build]
---

You are running the **tasks** step of HEROTYPE's lightweight spec-driven kit.

Read `specs/plan.md` and `specs/tasks.md`.

For: **$ARGUMENTS**

1. Decompose the plan into small, ordered, independently-verifiable tasks.
   Order by the constitution's priorities: core loop first, wow beat protected,
   polish last. Each task names the file(s) it touches.
2. Append them to `specs/tasks.md` under a dated heading, as `[ ]` checkboxes,
   mirroring the existing acceptance-criteria style.
3. If `--build` is passed, start executing the tasks top-down, checking each
   `[x]` as it is completed and verifying against the spec's acceptance
   criteria. Stop and surface anything that would breach the constitution.
4. Always keep the app in a runnable, demoable state between tasks — never
   leave the core loop broken.

Honour the cut list if you fall behind. Verify with `npm run build` before
declaring a batch done.
