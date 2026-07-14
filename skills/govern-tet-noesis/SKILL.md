---
name: govern-tet-noesis
description: Govern consequential or uncertainty-heavy agent work with the TET Noesis warranted-autonomy loop. Use when an agent must canonicalize state, calibrate uncertainty, isolate a blocking subproblem, require independent verification, issue a scoped capability lease, produce an execution receipt, govern memory, or evaluate offline self-improvement before acting.
---

# Govern TET Noesis

Turn an objective into a proof-gated decision and a bounded execution receipt.
Treat reflection as a proposal mechanism; let evidence, policy, and verifiers
authorize action.

## Choose the operating path

Use the proportional path for local, reversible, low-impact work. Use the full
path for external effects, destructive or hard-to-reverse actions, sensitive
data, cross-system changes, high uncertainty, or elevated repository policy.

Read `references/warrant-contract.md` when selecting a warrant level, defining
evidence or lease fields, or governing consequential work.

Do not use this skill to bypass repository governance, user confirmation,
authorization boundaries, or safety policy. Escalate secrets, auth, payments,
permissions, user data, production, and external publication as required by the
active policy.

## Run the warranted-autonomy loop

### 1. Bound the objective

- State the requested outcome in one testable sentence.
- Identify the authorized systems, files, tools, people, and effect boundary.
- Separate requested actions from adjacent improvements.
- Define the success test and rollback condition before execution.

### 2. Canonicalize current state

- Inspect the current source of truth instead of relying on remembered state.
- Record only facts relevant to the decision.
- Label every material claim `verified`, `unsupported`, or `contradicted`.
- Stop when a required source of truth cannot be inspected safely.

### 3. Calibrate uncertainty

- Assign uncertainty to material claims and to the overall decision.
- Explain the largest uncertainty drivers with concise evidence-based rationale.
- Never treat confidence, model agreement, repetition, or consensus as proof.
- Prefer a hold over invented certainty.

### 4. Open only the blocking subproblem

- Name the single unresolved question preventing a warranted decision.
- Freeze the parent objective while investigating that question.
- Set a recursion depth, time, or tool budget.
- Close the subproblem with evidence or return `HOLD`; do not branch into broad
  speculative research.

### 5. Build the proof set

- Attach provenance, freshness, relevance, and status to each proof item.
- Match proof strength to the consequence of the action.
- Require an independent verifier for consequential actions.
- Keep proposal generation and verification separate in role or mechanism.
- Treat a test, current source, policy check, or read-only review as a verifier
  only when it can falsify the proposal.

### 6. Decide the warrant

Return exactly one decision:

- `ALLOW`: required proof passes, uncertainty is within the declared threshold,
  the action is authorized, and a valid lease can be issued.
- `HOLD`: proof is incomplete, stale, unavailable, or too uncertain. State the
  smallest next verification step.
- `DENY`: proof contradicts the action, policy forbids it, or the requested
  effect exceeds authority. State the blocking rule.

### 7. Issue a semantic capability lease

Before acting, define:

- the exact allowed action and target;
- permitted tools and side effects;
- exclusions and prohibited actions;
- expiry, attempt, time, or cost budget;
- approval requirements and revocation conditions;
- the required post-action verifier and rollback path.

Treat the lease as inactive until every precondition is satisfied. Re-evaluate
the warrant if scope, state, evidence, or risk changes.

### 8. Execute and verify

- Perform only actions named by the active lease.
- Stop at the first unleased effect or failed precondition.
- Run the narrowest meaningful verification, then broaden it in proportion to
  risk.
- Compare the observed result with the success test.
- Revoke or expire the lease after the bounded action.

### 9. Produce the receipt

Return a concise Noesis Decision Envelope:

```txt
Objective:
Effect boundary:
Canonical state:
Uncertainty:
Blocking subproblem:
Evidence:
Independent verifier:
Decision: ALLOW | HOLD | DENY
Capability lease:
Execution result:
Receipt:
Memory candidates:
Residual risk:
```

Include commands, checks, timestamps, or artifacts needed to reproduce the
decision. Provide concise rationale and evidence; never expose private hidden
reasoning or claim consciousness.

### 10. Govern memory and improvement

- Store a memory candidate only with provenance, scope, retention, sensitivity,
  contradiction handling, and deletion rules.
- Let memory inform a decision; never let memory authorize an action.
- Prohibit live self-modification.
- Evaluate improvements offline with sandbox isolation, protected tests,
  explicit approval, a canary, monitoring, and rollback.

## Stop conditions

Return `HOLD` or `DENY` without execution when any of these conditions applies:

- canonical state is missing or contradictory;
- a required proof or independent verifier fails;
- uncertainty exceeds the declared threshold;
- authorization or approval is absent;
- the capability lease is missing, inactive, expired, or too broad;
- the requested action changes beyond the verified objective;
- rollback is required but unavailable;
- execution would reveal secrets or cross a prohibited boundary.
