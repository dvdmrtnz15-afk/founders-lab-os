# Implementation receipt — Noesis approval binding and README

- Task: bind Noesis human approval to the content it was granted for, strip
  authority from imported workspaces, and rewrite the README around the shipped
  architecture.
- Risk tier: CODE (multi-file policy change, no dependencies, no data
  migration). Push and pull request approved by the repository owner.
- Baseline: bc6514fb3836ce2e4bbc5bd254b5498dc415c22d.
- Repo inspected: Noesis evaluator, schema, tests, workbench state handlers,
  warrant panel, Exchange approval model, contract, product boundary docs, CI.
- Finding: the README principle "approval binds to a revision" held in Exchange
  but not in Noesis. Noesis kept approval through edits to objective, state,
  evidence, and lease, and imported files kept their approval flag.
- Files changed: `src/lib/noesis.ts`, `src/lib/noesis-schema.ts`,
  `src/lib/noesis.test.ts`, `src/app/noesis/noesis-workbench.tsx`,
  `src/app/noesis/components/warrant-panel.tsx`,
  `public/tet-noesis-contract.yaml`, `docs/product/TET_NOESIS.md`,
  `CHANGELOG.md`, `README.md`, this receipt.
- Architecture: `authorityFingerprint` hashes the authorizing content
  (workspace identity, tier, objective, canonical state, uncertainty, evidence,
  lease scope, tools, budget, expiry) with FNV-1a 64. `evaluateWarrant` returns
  a hard `approval_stale` blocker when a required approval's fingerprint does
  not match. `bindApproval` records the fingerprint on grant;
  `reconcileApproval` revokes a stale approval with an audit event;
  `stripImportedAuthority` deactivates the lease and clears approval on import.
  Receipts record `authorityFingerprint`.
- Compatibility: `approvalFingerprint` and `authorityFingerprint` are optional
  schema fields, so existing saved workspaces and receipts still load. Approvals
  saved before this change fail closed and must be granted again. Exchange is
  unaffected: its low-tier warrant does not require kernel approval and keeps
  its own revision binding.
- Frontend: `/noesis` unchecks approval and records why when approved content
  changes; imports arrive with the lease inactive and approval cleared.
- Backend/API/database: none.
- Security: strengthens authorization integrity. The fingerprint detects change;
  it is not a signature and does not resist deliberate tampering. Local approval
  remains outside the security boundary, as documented.
- Dependencies: none added.
- Tests added: 7 (bound approval allows; four content edits each block as stale;
  presentation edits and lease activation keep approval; legacy approval fails
  closed; reconcile revokes and audits; import strips authority; receipt records
  the fingerprint and round-trips).
- Tests run: `pnpm test` 27 passed across 3 files; `pnpm lint` passed;
  `pnpm format:check` passed; `pnpm build` passed including TypeScript.
- Browser proof: headless Chromium against the production build, 14 of 14
  checks passed: high tier blocks without approval, approval grants the warrant,
  editing the objective revokes approval and blocks, the revocation is audited,
  re-approval restores the warrant, the stored lease carries a fingerprint,
  import clears approval and deactivates the lease, a legacy approval is revoked
  on load, no horizontal overflow at 390px, no page errors.
- Known limitations: fingerprints are non-cryptographic; signed receipts remain
  roadmap step 1. A receipt does not consume the approval, so reactivating the
  lease on unchanged content can issue a second dry-run receipt.
- Rollback: revert the approval-binding commit. The previous strict schema does
  not know `approvalFingerprint`, so a browser workspace saved by this version
  will fail to load after a revert; reset the workspace or remove that field
  from the exported JSON.
- Release authority: feature branch and pull request only. No merge or
  production deploy performed.
