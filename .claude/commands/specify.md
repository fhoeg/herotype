---
description: Capture or refine a feature spec (the WHAT and WHY, not the how)
argument-hint: <feature description>
---

You are running the **specify** step of HEROTYPE's lightweight spec-driven kit.

Read `specs/constitution.md` first — it holds the locked decisions and the
fake-vs-real boundary. Nothing you write may contradict it; if the request
does, say so and stop.

For the feature described in: **$ARGUMENTS**

1. Write or update a spec section capturing **what** and **why** — user-visible
   behaviour, acceptance criteria, and what is explicitly out of scope. No
   implementation detail (no file names, no GSAP calls).
2. If it extends the existing product, append to `specs/herotype.spec.md` under
   a clear heading. If it is a distinct feature, create `specs/<slug>.spec.md`.
3. Keep it tight — this is a 3h hackathon. Prefer 5 sharp acceptance criteria
   over 20 vague ones.
4. End by listing open questions that block planning, and ask the user only if
   a decision is genuinely theirs.

Do not write code in this step. Next step: `/plan`.
