# TET Noesis Warrant Contract

Use this reference to scale proof, verification, approval, and execution
controls to the consequence of an action. Repository and platform policy always
override this baseline.

## Warrant levels

| Level    | Typical effect                                                                                   | Minimum proof                                                                      | Independent verification                                    | Approval and execution                                                 |
| -------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------- |
| Low      | Read-only inspection or local reversible draft                                                   | Current source plus a reproducible check                                           | Self-check may be sufficient when it can falsify the result | Execute within normal tool scope                                       |
| Medium   | Multi-file local edit or reversible configuration change                                         | Current state, relevant checks, rollback                                           | Separate check, test, or read-only reviewer                 | Issue a scoped lease; stop before external publication unless approved |
| High     | External communication, shared-state mutation, destructive action, or production-adjacent change | Multiple current proofs, policy check, rollback rehearsal where practical          | Independent mechanism or reviewer required                  | Explicit approval and narrow, expiring lease required                  |
| Critical | Secrets, auth, payments, permissions, regulated data, production release, or irreversible effect | Authoritative sources, threat/risk review, protected verification, tested rollback | Independent specialist and human authority required         | Hold unless active policy and explicit approval authorize execution    |

Escalate to the highest applicable level. Never reduce a level because the
agent feels confident or multiple models agree.

## Decision rules

Return `ALLOW` only when all applicable rules pass:

1. The objective and effect boundary are explicit.
2. The current state comes from an inspectable source of truth.
3. Required evidence is current, relevant, and verified.
4. No material evidence is contradicted or failed.
5. Uncertainty is at or below the declared threshold.
6. The verifier is sufficiently independent for the warrant level.
7. The actor has authority and all required approvals.
8. The capability lease exactly contains the proposed action.
9. A success check and rollback path exist when the effect requires them.

Return `HOLD` when missing information or verification could resolve the
decision. Return `DENY` when policy, evidence, or authority rules out the action.

## Evidence object

Represent each material proof item with these fields:

```yaml
claim: string
source: string
observed_at: ISO-8601 timestamp or revision
status: verified | unsupported | contradicted | failed
independence: proposer | independent
relevance: direct | supporting
freshness: current | stale | unknown
check: reproducible verification or artifact
```

Do not count an item as proof when its status, freshness, or source is unknown.
Do not count the same underlying source twice through different summaries.

## Capability lease

Issue a lease only after `ALLOW`:

```yaml
lease_id: stable receipt identifier
objective: exact bounded outcome
targets: explicit systems, files, or recipients
allowed_actions: enumerated actions
allowed_tools: enumerated tools
prohibited_actions: explicit exclusions
preconditions: proof, approval, and state requirements
budget: attempts, duration, cost, or change limit
expires_at: timestamp or terminal event
revocation: state changes or failed checks that cancel authority
postconditions: required verification
rollback: recovery action and trigger
```

Revoke the lease after success, failure, expiry, changed scope, changed state,
or contradictory evidence. A lease is not transferable to a new objective.

## Execution receipt

Record enough detail to audit the action without leaking secrets:

```yaml
decision: ALLOW | HOLD | DENY
warrant_level: low | medium | high | critical
canonical_state_revision: source revision or observation time
evidence_ids: verified proof references
verifier: independent check or reviewer
lease_id: identifier or null
actions_taken: bounded effects
checks_run: commands, tests, or observations
result: succeeded | failed | not_executed
rollback_status: not_needed | ready | executed | unavailable
residual_risk: concise remaining uncertainty
```

Redact secret values. Record whether a secret-dependent check passed, not the
secret itself.

## Generic example

```txt
Objective: Update a public documentation page and verify rendering.
Effect boundary: Local repository files only; no push or deployment.
Canonical state: Current branch, worktree, page source, and package scripts inspected.
Uncertainty: Low; preview deployment remains unverified.
Blocking subproblem: None for the local edit.
Evidence: Source inspection, formatter, linter, and build all verified.
Independent verifier: Static build rendered the route from a clean compilation.
Decision: ALLOW
Capability lease: Edit named docs; run local checks; expires before git push.
Execution result: Local files changed and checks passed.
Receipt: Diff and command results recorded.
Memory candidates: None.
Residual risk: Browser and hosted preview require separate approval and verification.
```
