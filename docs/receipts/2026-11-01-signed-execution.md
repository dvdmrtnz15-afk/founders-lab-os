# Receipt: Signed Warranted Execution

- Date: 2026-11-01
- Branch: `feat/signed-execution`, stacked on `feat/persona-substrate` (PR #12)
- Risk tier: 3 (adds an execution path behind the kernel; no deploy or
  production effect)

## Request

Close the loop from decision to action: sign personas and receipts, and add a
real executor behind the kernel.

## Changes

- `src/lib/signing.ts`: Ed25519 signed envelopes over canonical JSON via
  WebCrypto; non-extractable keys; trusted-key and purpose checks; canonical
  SHA-256 helper.
- `src/lib/executor/executor.ts`: `runWarranted` with all-or-nothing preflight,
  execute and verify, persona voice lint, newest-first compensation, timeouts,
  operator stop signal, lease revocation, and signed receipts for every
  outcome.
- `src/lib/executor/node/command-adapter.ts`: no-shell, fixed-argv,
  minimal-env command adapter for Node hosts.
- `src/lib/noesis-schema.ts`: `execution_completed` and `execution_refused`
  audit kinds.
- Docs: `docs/product/EXECUTION.md`, README status, shipped table, and known
  limits, CHANGELOG.

## Verification

- `pnpm test`: 13 files, 143 tests passed (28 new: 10 signing, 18 executor and
  adapter, including real child processes for exit codes, secret isolation,
  input rejection, and timeouts).
- `pnpm lint` 0 problems; `pnpm format:check` clean; `tsc --noEmit` clean;
  `pnpm build` passed.
- End-to-end on this repository: a signed `role:noesis-governor` ran
  `git status` and `tsc --noEmit` through command adapters. Outcome
  `executed`, both steps verified, lease revoked, receipt signature verified
  against the trusted key.

## Residual risk

- The executor is not a sandbox; adapters hold host privileges.
- Key storage, rotation, and a trust registry are host responsibilities for
  now.
- The workbench UI does not call the executor.

## Rollback

Revert the commit. No stored data depends on it beyond the two optional audit
kinds.
