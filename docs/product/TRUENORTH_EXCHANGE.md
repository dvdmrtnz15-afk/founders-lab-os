# TrueNorth Exchange — first release

## Working product

`/exchange` extends FounderLab OS with an asset transaction preparation workspace.
It reuses the existing Noesis ID, workspace and warrant engine and the installed
Next.js/React/Zod/Vitest stack. No private source was copied from another repo.

- Editable mandate, custom property intake, sample scenarios, filters, shortlist.
- Side-by-side acquisition, NOI, cash flow, cap-rate and occupancy stress comparisons.
- Asset dossier and bounded source/evidence records with user-reported status.
- Local packet approval tied to both asset and mandate revision; edits revoke it.
- Markdown diligence packet with assumptions, source dates, gaps and scope.
- AES-256-GCM encrypted browser checkpoint and portable encrypted vault export/import.
- Device-local activity. No false immutable-audit or cryptographic-signature claim.

## Data boundary

The workspace lives in session memory until explicitly encrypted and saved.
`truenorth.exchange.encrypted.v1` contains only an encrypted envelope in localStorage.
Passphrases and plaintext keys are not persisted or transmitted. PBKDF2-SHA256 uses
310,000 iterations, a random 16-byte salt and a 12-byte AES-GCM nonce. A fixed
version-specific authenticated context binds ciphertext to this format. A unique,
long passphrase is necessary. Browser code and open-session compromise remain
outside at-rest encryption protection. Password loss is unrecoverable.

Restoration validates strict Zod schemas, bounded collections, URL schemes,
finite numeric ranges, format/iteration constants, 4 MB size and unique IDs.
Imported approvals always clear. Checkpoints are explicit, not automatic; unsaved
changes are lost on reload. No authentication, server persistence, shared tenancy,
cloud synchronization or multi-device continuity is claimed.

Evidence statuses are user assertions. Noesis authorizes only _local packet
preparation_ based on valid inputs and the recorded scope; it does not evaluate
investment suitability, certify title, establish source truth, or execute effects.
The current local approval mechanism is not a security boundary against someone
with control of the browser. A server-authoritative system is required for effects.

## Provider adapter boundary

Research/LLM, live property feeds, legal professionals, e-signature, booking,
payment/escrow and crypto are explicitly unconnected. No provider calls or
transaction simulation occurs. Future adapters must identify actor/tenant,
provider and credential ownership; classify read/action/commit; bind exact
input/document hashes; enforce grants server-side; verify external receipts;
carry idempotency and retry semantics; and handle conflicts/cancellation.

Model research needs authenticated, rate-limited server endpoints and sources.
Listing access needs authorized feed terms. Professional review and settlement
need actual providers. A transaction cannot be marked completed by local UI state.
The existing read-only Shadow Router R0 is not promoted to an executor here.

## Financial model

Gross income = monthly rent at full occupancy × 12 × occupancy fraction.
NOI = gross income − entered monthly operating expenses × 12.
Cap rate = NOI / entered purchase price; undefined for zero price.
Cash flow = NOI − entered annual debt service.
Total acquisition = purchase price + entered closing costs.
Occupancy scenarios vary occupancy only. Include all relevant operating costs in
expenses; no appreciation, income-tax or sale proceeds model is included. All
sample assets are synthetic and all figures are assumptions, not market claims.

## Release and rollback

GitHub feature branch and preview-first Vercel deployment. No new paid services,
secrets, external communications, financial transactions or custody. Roll back by
reverting the Exchange feature commit. Existing Noesis schema/state is unchanged.
