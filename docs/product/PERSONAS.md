# Persona Substrate

Typed, attenuating agent personas that the Noesis kernel can enforce. A persona
says who is acting, how it sounds, and the most authority it may ever hold. It
never grants authority by itself: evidence, policy, the lease, and a bound
human approval still decide.

Source: `src/lib/persona/`. UI: the **Persona & council** panel on `/noesis`.

## What a persona is

| Field                                  | Meaning                                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------------------ |
| `ref`, `version`                       | `namespace:slug` identity; the version must strictly increase on every revision.           |
| `axes.style / decision / social`       | Three readable trait axes (adjective plus a 0–1 level).                                    |
| `voice.do / avoid / spark`             | Human-readable voice rules.                                                                |
| `voice.bannedPhrases / mustIncludeAny` | Machine-checkable voice rules used by `lintPersonaOutput`.                                 |
| `governingLaw`                         | The single most important boundary, in one sentence.                                       |
| `forbiddenActions`                     | Kebab-case actions the persona must never take.                                            |
| `riskCeiling`                          | Highest warrant tier the persona may act under.                                            |
| `escalateAtOrAbove`                    | Tier at which a bound human approval becomes mandatory.                                    |
| `allowedTools / blockedTools`          | Lease tools the persona may hold. The blocklist always wins; `["*"]` is the only wildcard. |
| `parentRef`                            | The persona this one derives from. A child can never exceed its parent.                    |

The schema is strict: unknown fields, a tool that is both allowed and blocked,
duplicates, a self-parent, and overclaiming terms ("sentient", "AGI",
"guaranteed", "100% accurate") in the name, mission, or law are all rejected.

## Kernel enforcement

Attaching a persona to a workspace is optional. With no persona or council, the
kernel and the authority fingerprint are unchanged (pinned in
`src/lib/noesis.persona.test.ts`).

| Blocker                       | Hard | Fires when                                                             |
| ----------------------------- | ---- | ---------------------------------------------------------------------- |
| `persona_invalid`             | yes  | The attached persona fails the schema.                                 |
| `persona_ceiling_exceeded`    | yes  | The warrant tier is above the persona's ceiling.                       |
| `persona_tool_blocked`        | yes  | A lease tool is blocked for, or not allowed to, the persona.           |
| `persona_escalation_required` | yes  | The tier reaches the persona's escalation tier with no bound approval. |
| `council_invalid`             | yes  | A reviewer voted twice, or the acting persona reviewed itself.         |
| `council_veto`                | yes  | A reviewer cast a blocking hard veto.                                  |
| `council_hold`                | no   | A reviewer warned or blocked without a hard veto.                      |

The persona's fingerprint and the council votes join the authority fingerprint
when present, so changing either revokes a granted approval. Receipts record
`personaRef` and `personaFingerprint`.

**A council can only object.** A unanimous pass is `no_objection`, adds no
evidence coverage, and cannot lift a held workspace. This keeps the public
contract's rule that self-confidence and consensus count as zero proof.

## Library

- `checkAttenuation(parent, child)` and `verifyLineage(chain)` report every way
  a child widens its parent (ceiling, tools, dropped blocks or forbidden
  actions, weaker escalation).
- `derivePersona(parent, draft)` builds a child that is attenuated by
  construction.
- `checkPersonaUpgrade(previous, next)` enforces version monotonicity so an
  older, more permissive persona cannot be replayed.
- `computeStylometric`, `stylometricDistance`, and `findIndistinctPersonas`
  detect voice drift and personas that have collapsed into one voice.
- `lintPersonaOutput(persona, text)` checks drafts against banned phrases,
  overclaiming terms, and required markers.

## Reference registry

`src/lib/persona/registry.ts`:

- `founderlab:constitution`: root persona encoding `.claude/CLAUDE.md`. It blocks
  `git push`, `deploy production`, `read env files`, and `destructive shell`,
  and escalates at `high`.
- `role:*`: the twelve `agents/*.agent.md` roles, each attenuating the root.
- `brand:spellshimmer-oracle`: the LYZT-AI Oracle / SpellShimmer policy. Ceiling
  `low`; forbids medical, legal, and financial advice, specific predictions,
  fatalism, and dependency; every reading must acknowledge uncertainty.

## Provenance

| Idea                                          | Origin                                                               | Change made here                                        |
| --------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------- |
| One spec for every persona                    | LYZT `shared/agents/universal-agent-spec.ts`                         | Strict zod schema instead of a resolver table.          |
| Three trait axes and a governing law          | LYZT `shared/agent-dna.ts`                                           | Stored compiled; no 144-dimension vectors.              |
| Content hash, allow/block, ceiling, monotonic | LYZT `shared/governance/agent-contract.ts`                           | Folded into the persona and the authority fingerprint.  |
| Children never exceed parent                  | LYZT `server/dase/derived-agent-engine.ts`                           | Pure checks plus construction-time derivation.          |
| Council verdict with hard veto                | LYZT `shared/schema/council-verdict.ts`                              | Can only veto or hold; never passes work.               |
| Duplicate-voter rejection                     | `founderlab-cogmesh` clone grouping                                  | Applied to council votes, plus a self-review ban.       |
| Stylometric fingerprint                       | LYZT `server/services/stylometric.ts`                                | Pure, no `node:crypto`, adds a distance metric.         |
| Name guard                                    | LYZT `shared/agent-name-guard.ts`                                    | Whole-word matching ("managing" no longer trips "agi"). |
| Do / avoid / spark voice; Oracle policy       | LYZT cinema brand voice and `server/change-guard/domain-policies.ts` | Machine-checkable subset and required markers.          |

Deliberately not imported: 144-trait vectors, Greek-letter cognition lobes,
ELO prompt tournaments, and learned routers. They need model calls or add
weight without an enforceable decision.
