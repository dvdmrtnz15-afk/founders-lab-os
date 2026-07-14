# TET Noesis Public Reference Preview

## Product intent

TET Noesis is a governed metacognitive agent architecture built around warranted
autonomy:

> Think recursively. Know what is uncertain. Act only with proof.

The first FounderLab OS implementation is intentionally a visible reference
workbench, not a claim of a complete autonomous runtime. It makes the decision
contract inspectable before persistence, tools, or production execution are
introduced.

## What the preview implements

- A canonical objective and state boundary.
- Explicit calibrated uncertainty.
- An evidence ledger with weights, provenance labels, and verifier independence.
- Recursion that opens only the blocking subproblem.
- A semantic capability lease with visible scope and budget.
- A deterministic warrant decision: allow, verify, or block.
- A simulated execution receipt after the warrant is satisfied.
- Public contract download at `/tet-noesis-contract.yaml`.

## Deliberate non-goals

- No model inference or model provider integration.
- No external tool execution.
- No persistent memory, user data, database, auth, or RBAC.
- No production actions or live self-modification.
- No claim that coordination or self-modeling constitutes consciousness.

## Warrant rule

The reference evaluator permits the simulated receipt only when all of the
following are true:

1. The capability lease is active.
2. No required evidence has failed.
3. Weighted proof coverage is at least 80%.
4. At least one independently sourced proof is verified.
5. Calibrated uncertainty is at or below 25%.

Self-confidence and consensus do not satisfy any proof requirement.

## Upgrade path to a persistent kernel

A production implementation should add capabilities in this order:

1. Versioned canonical-state storage and immutable receipts.
2. Adapter contracts for model proposals and independent verifiers.
3. Policy-enforced capability leases with expiry, scope, and revocation.
4. Sandbox-only execution with protected tests and rollback.
5. Governed memory with provenance, retention, contradiction tracking, and
   deletion policy.
6. Human approval, canary release, and monitored rollback before any production
   action.

Each step requires a separate threat-model, RBAC, data, API, and test update.

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
