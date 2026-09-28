# TrueNorth Exchange implementation plan

## Objective and authorization

The user requested building the asset transaction model using existing codebases,
GitHub, and Vercel. This authorizes implementation, a feature branch, pull request,
and Vercel preview deployment. Production follows the repository's preview-first
policy. No transactions, external outreach, provider signup, or paid purchases.

## Repository map

Baseline: d10a82392d214f668b1d953de8135df5627b94c1.
Next.js 16 / React 19 / Zod 4 / pnpm / Vitest. Existing `/` and `/noesis`
routes, deterministic Noesis schemas, evidence and warrant evaluation, browser
storage and portable receipts. No authentication, shared database, external
execution adapter, or payment infrastructure. GitHub repository and Vercel project
identities were inspected through their connected services.

## Affected files and architecture

Add `src/app/exchange/` (route, workspace, scoped styles),
`src/lib/exchange/` (schemas, state, financial calculations, Noesis adapter,
cryptographic vault and focused tests). Add an entry link to `src/app/page.tsx`.
Update README, route/component registries, product contract and release receipt.
Reuse `createInitialNoesisWorkspace`, `evaluateWarrant`, and `createNoesisId`.
Preserve existing Noesis behavior, root metadata, dependencies and lockfile.

## UI surfacing

A working transaction dashboard with opportunity search, comparison, editable
mandate, asset intake, due-diligence evidence, financial scenarios, scoped packet
approval, activity, encryption/import/export and explicit connection status.
Use illustrative sample assets, clearly labeled; accept the user's real asset
facts and evidence. All estimates identify their assumptions. No simulated live
provider responses, professional verification, signatures or settlement.

## Data and security

Session memory by default; optional password-encrypted checkpoint in this browser
and encrypted file export. Web Crypto PBKDF2-SHA256 and AES-256-GCM, randomized
salt/IV, bounded schema-validated imports. Passwords/keys never persisted or sent.
No backend or schema migration. Shared sync, authentication, live research,
listings, legal services and settlement remain visibly unconnected. No custody.
Imported approvals are informational and never activate permissions. A local
packet authorization binds the current asset/mandate revision and is invalidated
on material edits. Only user-requested export/backup actions touch browser storage.

## Verification and rollback

Focused tests: invalid imports and URLs, nonfinite/negative economics, stressed
NOI, approval invalidation, Noesis adapter, encryption round-trip, wrong password,
and altered ciphertext. Run formatting, tests, lint, TypeScript and production
build; inspect desktop/mobile and principal browser flows. Independent read-only
specialist review required by AGENTS.md before release. Rollback: revert the
bounded feature commit; existing routes and persisted Noesis state are untouched.

## Bounded lease

ALLOW local reversible implementation within the listed files, install existing
locked dependencies, and run checks. Expires after this task. GitHub publication
and Vercel preview require checks and independent review; both are user-authorized.
Keep source private to its original repositories: no private Agent Hub source is
copied into this public repository. Production promotion only after preview proof.
