# Implementation receipt — IPF reference and conformance vectors

- Task: land the Invariant Probability Flow reference on `main` and publish
  portable conformance vectors that any runtime claiming protocol `0.1.0` must
  pass, as the first step before Lyzt wires probability flow into its
  prepare/commit path.
- Risk tier: CODE (multi-file feature, authorization-binding change). No
  dependency change, no backend, no migration. Push and pull request approved by
  the repository owner.
- Baseline: `ff4a04410d4c6d9fd8d63a00a6b6ad32a2d6a27c` (`main` after PR #10).

## Finding that motivated this change

The probability-flow protocol existed in two copies that both declared `0.1.0`:
the reference on the unmerged `feat/auth-foundation` branch and the Lyzt mirror
used by its server-side verifier. Both reproduced the documented demo-vector
SHA-256, which was the only cross-runtime check specified. A local run of
identical inputs through both copies, each with the zod version its repository
pins, showed the Lyzt mirror accepting five inputs the reference rejects
(observer expiry before observation, observer/node identifier collision,
dangling dependency-node reference, dependency-node cycle, relationship effect
without the second principal) and authorizing an effect in every case. It also
omits the `action_dependency_cycle` blocker code, so it cannot replay a
reference receipt for that input. The Lyzt invariant is registered but no
non-test transition requires it yet, so the gap is latent.

## Changes

1. Cherry-picked `d317279` (probability-flow harness) from
   `feat/auth-foundation`, keeping original authorship. Left out: the Next.js
   16.3.0 upgrade, the postcss override removal, the generated AGENTS.md block,
   and the README hunk. The dormant Auth.js commit was not included.
2. Extended content-bound approval to the probability-flow envelope
   (`noesis-authority-v2`): enabled flag, canonical inputs with `forecastAsOf`
   excluded, and the latest decision with its authorized effects. The workbench
   reconciles approval after flow edits and resolutions. Without this, an
   approval survived disabling the flow or re-resolving it to a different
   outcome.
3. `evaluateWarrant` now blocks instead of throwing when probability-flow inputs
   fail the protocol schema.
4. Added `public/ipf-conformance-v0.1.0.json`: four accept vectors (baseline,
   key-order independence, observer expiry revocation, action-cycle reporting)
   with exact canonical-input SHA-256, decision, authorized effects, and blocker
   codes; five reject vectors for the referential-integrity rules. Each records
   its derivation from the reference demo. The baseline reproduces the
   previously documented `ec3eba97…` commitment.
5. Added `src/lib/probability-flow.conformance.test.ts`, which runs every vector
   against the reference in CI.
6. Documented the vectors and made a passing run a gate for Lyzt adoption step 4
   in `docs/architecture/IPF_LYZT_INTEROP.md`; updated README, TET_NOESIS,
   contract, and CHANGELOG.

## Verification

- `pnpm test`: 67 passed across 6 files (4 new approval tests, 10 conformance
  tests).
- `pnpm lint`, `pnpm format:check`, `pnpm build` (TypeScript included): passed.
- Mutation check: disabling the reference's dependency-cycle rule makes exactly
  `reject-dependency-node-cycle` fail; restored afterwards.
- Cross-runtime check (local, read-only): the Lyzt mirror passes 3 of 9 vectors.
  No Lyzt files were modified.
- Browser check against the production build, 13 of 13: panel renders, bound
  approval satisfies the high tier, identical re-resolution keeps approval,
  disabling the flow revokes and audits approval, conformance file served at
  `/ipf-conformance-v0.1.0.json`, no overflow at 390px, Exchange renders, no
  page errors.

## Known limitations

- Probability-flow weights, including psychology-facing ones, are unvalidated
  research scaffolding; vectors prove agreement between runtimes, not
  correctness of the weights.
- Approvals saved under the v1 fingerprint fail closed and must be granted
  again.
- Workspaces saved before this change load with a default, unresolved flow (an
  existing behavior of the cherry-picked commit), which holds them at `verify`
  until resolved.
- The interop document and contract name internal Lyzt module paths in this
  public repository.

## Rollback

Revert the three commits on this branch. Workspaces saved by this version carry
a `probabilityFlow` field and v2 fingerprints; the previous strict schema
rejects `probabilityFlow`, so export the workspace first and reset locally after
a revert.

## Release authority

Feature branch and pull request only. No merge or production deploy performed.
The Lyzt-side change (port the missing validations and run the same vectors) is
a separate pull request in that repository.
