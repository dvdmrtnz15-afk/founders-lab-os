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

## Live Claude calls

`src/lib/experts/node/claude-expert.ts` (server-only) runs the loop for real
with the official `@anthropic-ai/sdk`:

- `runBrief` sends a compiled brief to Claude Opus 5.5 with the routed effort
  and the deliverable as a structured-output JSON schema. It opts into
  server-side refusal fallback (`fallbacks: "default"`, beta
  `server-side-fallback-2026-07-01`), so a classifier decline retries on
  Anthropic's recommended model for that category; the result reports which
  model served it. It checks `stop_reason` first and never reads content from
  a refusal or a truncated reply.
- `consultExpert` routes the task, gets the answer, verifies it against the
  contract, and only then asks the independent reviewer. The reviewer's
  verdict becomes a council vote. An answer is accepted only when the
  contract holds and the reviewer did not block.
- `createExpertAdapter` exposes the loop as the `consult expert` lease tool,
  so a consultation runs through the warranted executor: kernel `ALLOW`,
  persona permission (granted to `role:noesis-governor`), single-use lease,
  and an Ed25519-signed receipt.

Credentials come from the environment the SDK reads (`ANTHROPIC_API_KEY`, or
an `ant auth login` profile). Nothing in the repository reads `.env` files.

## Not yet built

- An "ask the expert" button on `/experts`. It needs a server endpoint that
  spends the API key, and the app has no authentication yet, so a public
  endpoint would let anyone run up the bill. Add auth first.
- Routing is lexical. A model-assisted router can be added later, but the
  deterministic router stays as the explainable default and fallback.
