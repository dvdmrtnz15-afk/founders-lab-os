# TET Noesis Local Governance Harness

## Product intent

TET Noesis is a governed metacognitive agent architecture built around warranted
autonomy:

> Think recursively. Know what is uncertain. Act only with proof.

The FounderLab OS implementation is an operational, local-first governance
harness, not a claim of a complete autonomous runtime. It turns the decision
contract into an editable, validated workspace while keeping external execution
disabled.

## What the harness implements

- An editable canonical objective and state boundary.
- Explicit calibrated uncertainty.
- An evidence ledger with weights, provenance labels, and verifier independence.
- Recursion that opens only the blocking subproblem.
- A semantic capability lease with visible scope, tools, budget, expiry, human
  approval, activation, and automatic revocation.
- Proportional low, medium, high, and critical warrant policies.
- A deterministic warrant decision: allow, verify, or block.
- Strict Zod validation for imported and stored workspace JSON.
- Versioned browser-local persistence with explicit reset and export controls.
- An append-only local audit trail and downloadable dry-run receipts.
- Vitest policy and schema regression tests enforced in CI.
- Public contract download at `/tet-noesis-contract.yaml`.
- An attachable Invariant Probability Flow envelope that resolves tail risk,
  first-passage exposure, protected-boundary flux, identity liabilities,
  observer freshness, witness reductions, and two-principal autonomy before the
  Noesis warrant can issue a dry-run receipt.

## Deliberate non-goals

- No model inference or model provider integration.
- No external tool execution.
- No shared database, organization tenancy, auth, RBAC, telemetry, or server-side
  persistence.
- No production actions or live self-modification.
- No claim that coordination or self-modeling constitutes consciousness.
- No fitted Fokker--Planck model, validated psychological coefficient, or claim
  that the two 144-cardinality systems are semantically equivalent.

## Invariant Probability Flow

The local workbench includes protocol `0.1.0` as an operational research
harness. It accepts calibrated probability summaries, authorizes a
dependency-closed subset of candidate effects, transitively revokes stale
observer dependents, and embeds the replayable flow receipt in the Noesis
receipt. The equations, theorem targets, claim boundary, falsification surface,
and Lyzt adoption plan are documented in
[`INVARIANT_PROBABILITY_FLOW.md`](./INVARIANT_PROBABILITY_FLOW.md).

## Warrant policies

The evaluator uses the highest declared consequence level:

| Level    | Proof coverage | Maximum uncertainty | Independent proof | Human approval |
| -------- | -------------- | ------------------- | ----------------- | -------------- |
| Low      | 60%            | 40%                 | Optional          | No             |
| Medium   | 80%            | 25%                 | Required          | No             |
| High     | 90%            | 15%                 | Required          | Required       |
| Critical | 100%           | 10%                 | Required          | Required       |

The harness permits a dry-run receipt only when all applicable rules pass:

1. The capability lease is active.
2. No required evidence has failed.
3. Weighted proof coverage reaches the selected policy threshold.
4. Independently sourced proof and human approval are present when required.
5. Calibrated uncertainty is at or below the selected policy threshold.
6. The objective, canonical state, lease scope, and permitted tools are valid.

Self-confidence and consensus do not satisfy any proof requirement.

## Local data boundary

The current workspace is stored under `founderlab.noesis.workspace.v1` in the
browser's local storage. No background request, analytics call, cookie, or
server write is performed. Users can export a versioned JSON workspace, import
only a schema-valid workspace, download individual receipts, or clear the local
workspace through a two-step reset.

## Upgrade path to a persistent kernel

A production implementation should add capabilities in this order:

1. Shared, tenant-aware canonical-state storage and immutable receipt signing.
2. Adapter contracts for model proposals and independent verifiers.
3. Server-enforced capability leases, policy decisions, and revocation.
4. Sandbox-only execution with protected tests, observability, and rollback.
5. Governed shared memory with provenance, retention, contradiction tracking, and
   deletion policy.
6. Human approval, canary release, and monitored rollback before any production
   action.

Each step requires a separate threat-model, RBAC, data, API, and test update.

## Repo-native operator package

The public repository includes a generic Noesis package for agent runtimes and
coding assistants:

- `skills/govern-tet-noesis/SKILL.md` defines the warranted-autonomy workflow,
  stop conditions, and decision envelope.
- `skills/govern-tet-noesis/references/warrant-contract.md` defines proportional
  warrant levels, evidence objects, capability leases, and receipts.
- `agents/noesis-governor.agent.md` defines the reusable governor role.

Invoke the skill for consequential or uncertainty-heavy work. It permits a
bounded action only after canonical state, sufficient proof, authorization, an
independent verifier, and an active semantic capability lease are present. It
does not bypass host-platform confirmation, repository policy, or human review.

## Research context

The design treats external verification as a requirement rather than trusting
intrinsic self-correction alone. Relevant background includes
[Large Language Models Cannot Self-Correct Reasoning Yet](https://arxiv.org/abs/2310.01798)
and OpenAI's work on
[process supervision](https://openai.com/index/improving-mathematical-reasoning-with-process-supervision/).

The interface describes self-modeling and workspace coordination as functional
mechanisms, not consciousness claims. The 2025 adversarial collaboration in
Nature reported results that challenged important predictions of both GNWT and
IIT:
[Adversarial testing of global neuronal workspace and integrated information theories of consciousness](https://www.nature.com/articles/s41586-025-08888-1).
