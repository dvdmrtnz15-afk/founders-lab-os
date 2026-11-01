# Warranted Execution

The step after an `ALLOW`. The kernel decides; the executor acts only inside
that decision, checks what happened, and signs a receipt. Source:
`src/lib/executor/` and `src/lib/signing.ts`.

```text
evaluateWarrant ─► preflight every step ─► execute ─► verify ─► receipt (signed)
     │ not ALLOW         │ any refusal          │ failure
     ▼                   ▼                      ▼
  refused             refused          compensate newest-first
  (lease kept)        (lease kept)     → rolled_back | failed
```

## Guarantees

| Guarantee                    | How                                                                                                                                                       |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nothing runs without `ALLOW` | `runWarranted` re-evaluates the workspace itself; it does not trust a caller's decision.                                                                  |
| All-or-nothing preflight     | Every step must be on the lease, permitted to the persona, and have an adapter, within the step cap. One bad step refuses the whole plan before any runs. |
| Signed persona (optional)    | With `personaTrust`, the attached persona must match a persona signed by a trusted key. Missing, untrusted, tampered, or mismatched signatures refuse.    |
| Verified, not assumed        | Each step is verified by its adapter, and any text it produces is linted against the persona's voice rules.                                               |
| Honest rollback              | On failure, completed steps are compensated newest-first. A step with no compensation, a failed compensation, or a step that threw yields `failed`.       |
| Single-use lease             | Any run that starts revokes the lease, whatever the outcome. A refusal leaves it untouched.                                                               |
| Bounded                      | Per-step timeout (default 60 s) aborts the adapter; an operator `AbortSignal` stops the run between steps.                                                |
| Every call is receipted      | Outcomes `executed`, `rolled_back`, `failed`, and `refused` all produce an Ed25519-signed receipt with input and output digests, never raw data.          |

## Signing

`src/lib/signing.ts` signs canonical JSON with Ed25519 through WebCrypto, so
there is no dependency. Keys are generated non-extractable. A verifier must
supply the key ids it trusts and the expected purpose (`persona` or
`execution-receipt`), so a valid signature from an unknown key, or a persona
signature replayed as a receipt, fails.

## Adapters

An adapter implements one lease tool: `execute`, `verify`, and optional
`compensate` (the free-agents capsule lifecycle). The reference
`createCommandAdapter` (Node only) runs one fixed command:

- no shell (`execFile`), and step input must be empty, so there is no argument
  injection;
- only `PATH` and `HOME` reach the child, so host secrets are not inherited;
- verification is exit code 0; output is truncated to a short tail;
- `readOnly: true` declares that rollback needs no undo. Commands with side
  effects get no compensation and are reported for manual review on failure.

## Threat notes and limits

- The executor is not a sandbox. Adapters run with the calling process's
  privileges; review them like privileged code.
- Keys and trusted key ids are supplied by the host. Storage, rotation,
  revocation, and a shared trust registry are not built yet.
- Receipts are returned to the caller. Durable, append-only storage is the
  host's job today.
- The browser workbench does not call the executor; it still issues dry-run
  receipts only.
