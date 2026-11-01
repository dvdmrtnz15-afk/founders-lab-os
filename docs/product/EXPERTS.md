# Expert Desk

**Experts, not characters.** Character apps give a model a name and a voice.
An expert adds what makes the answer useful and checkable. Route: `/experts`.
Source: `src/lib/experts/`.

| A character has   | An expert also has                                                           |
| ----------------- | ---------------------------------------------------------------------------- |
| A name and voice  | Routing signals that say when it is the right specialist                     |
| A backstory       | A method: how it approaches the work                                         |
| Free-form replies | A deliverable contract enforced as a structured-output schema                |
| Self-assessment   | A rubric graded by an independent reviewer on a different persona            |
| No limits         | A governed persona: risk ceiling, tool limits, forbidden actions, escalation |
| One model setting | A routed effort level, raised for risk and complexity                        |

## The loop

```text
task ─► routeTask ─► expert + effort + risk + reviewer   (explainable, no model call)
          │
          ▼
   compileExpertBrief ─► Claude Opus 5.5 + structured-output schema
          │
          ▼
   verifyExpertOutput ─► contract complete? persona voice clean?
          │
          ▼
   compileReviewBrief ─► reviewer grades against the author's rubric
          │
          ▼
   reviewToCouncilVote ─► Noesis council: security block = hard veto
          │
          ▼
   evaluateWarrant / runWarranted ─► signed receipt
```

## Routing

- Whole-word signal matching with weights; every choice lists the signals
  that produced it.
- Below a minimum score, or when two experts are close, the router asks a
  clarifying question instead of guessing.
- Risk terms (production, payment, PII, data loss, migration, auth, …) raise
  effort one level and set a suggested warrant tier. Long tasks raise effort;
  "quick", "typo", or "small" lower it when no risk term is present.
- When the suggested tier exceeds the expert's persona ceiling, the desk says
  so: the expert may advise, but a human approval is required to act.
- Strong secondary matches are listed as experts to also consult.

## Model policy

Every expert runs on **Claude Opus 5.5** (`claude-opus-5-5`). Per task, the
brief, the deliverable contract, and the effort level change; the model is
never silently downgraded to save cost. Briefs are short and declarative
(role, method, boundaries, deliverable, rubric), which suits current Claude
models better than step-by-step scripts.

## Catalog

Code Reviewer, Debugger, Systems Architect, Security Auditor, Frontend
Builder, Data Engineer, Product Strategist, Test Engineer, Release Engineer,
Technical Writer, Repo Cartographer, and SpellShimmer Oracle Guide. Each rides
a persona from the registry; `experts.test.ts` checks every persona and
reviewer exists and that no reviewer shares its author's persona.

## Not yet built

- The live Claude call. The desk compiles and displays the brief; sending it
  requires a host adapter using the official `@anthropic-ai/sdk`, which is a
  new dependency awaiting approval.
- Routing is lexical. A model-assisted router can be added later, but the
  deterministic router stays as the explainable default and fallback.
