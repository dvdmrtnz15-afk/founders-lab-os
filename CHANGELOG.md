# Changelog

## Unreleased

- Bound Noesis human approval to the content it was granted for. The evaluator
  fingerprints the authorizing content and returns `approval_stale` (hard
  block) when it changes; the workbench revokes stale approvals with an audit
  event; imports arrive with the lease inactive and approval cleared; receipts
  record the authorized content fingerprint. Approvals saved before this change
  must be granted again.
- Rewrote the README around the product thesis, shipped architecture, source
  map, roadmap, and known limits.
- Replaced the static command center and Noesis preview with a responsive,
  operational local harness: editable canonical state and leases, proportional
  warrant policies, strict JSON import/export, browser-local persistence, audit
  history, downloadable dry-run receipts, automatic lease revocation, Zod 4
  contracts, Vitest coverage, and CI test enforcement.
- Made the project public-ready with a generalized README, package metadata,
  local-tool ignore rules, and a pnpm/Next.js CI workflow.
- Added the TET Noesis public reference workbench, deterministic warrant
  evaluator, machine-readable agent contract, product boundary, and responsive
  cockpit entry point.
- Added a generic `govern-tet-noesis` skill, warrant contract, and Noesis
  Governor agent profile for proof-gated decisions, scoped capability leases,
  verified execution, governed memory, and offline improvement.
- Added the Agentic Software Factory OS starter pack: root `AGENTS.md`,
  specialist agent roles, task skills, product docs, architecture docs, design
  maps, data/API/security/testing/ops baselines, PR template, issue templates,
  `CODEOWNERS`, `SECURITY.md`, `CONTRIBUTING.md`, and safe `.env.example`.
