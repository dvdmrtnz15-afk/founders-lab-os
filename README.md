# FounderLab OS

**Proof-gated authorization for AI agents that take real actions.**

[![CI](https://github.com/dvdmrtnz15-afk/founders-lab-os/actions/workflows/ci.yml/badge.svg)](https://github.com/dvdmrtnz15-afk/founders-lab-os/actions/workflows/ci.yml)

> Models propose. A deterministic kernel decides. Every action leaves a
> receipt.

FounderLab OS is the control layer between an AI agent and the actions it wants
to take. Before an agent merges code, prepares a transaction, or touches
anything consequential, the **TET Noesis™ kernel** evaluates the proposal
against explicit evidence, declared uncertainty, a scoped capability lease, and
a risk-proportional policy. It returns `ALLOW`, `VERIFY`, or `BLOCK` with
machine-readable reasons. An allowed action produces a structured receipt, and
the lease that authorized it is revoked.

> **Status: v0.x kernel preview.** The decision kernel, strict schemas,
> capability leases, receipts, and two reference applications are shipped and
> covered by tests in CI. Execution is dry-run only by design: no model calls,
> no external effects, no server. See
> [What's shipped and what's next](#whats-shipped-and-whats-next).

## The problem

Agents are moving from suggesting to doing: merging pull requests, changing
configuration, moving money, preparing contracts. Most agent stacks answer two
questions well:

- **Can the model do it?** That is capability.
- **Is the output acceptable?** That is content filtering and guardrails.

Far fewer answer the question that security reviewers, auditors, and incident
responders actually ask:

> _Why was this agent allowed to take this specific action, on what evidence,
> under whose authority, and how do we undo it?_

Without a defensible answer, organizations keep agents read-only. That gap is
the bottleneck between agent demos and agent deployments.

## Why now

Tool-calling standards such as the Model Context Protocol have made it easy to
connect agents to real systems. Nothing comparably standard decides whether a
given call should happen. At the same time, regulation such as the EU AI Act
requires documented human oversight for high-risk AI systems. Authorization
with an audit trail is becoming a prerequisite for deployment, not a feature.

## Design principles

| Principle                         | How the code enforces it                                                                                                                                                                                                        |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Proposal is not permission        | Model output is only a proposal. Self-confidence and multi-agent consensus count as zero proof (`self_confidence_counts_as_proof: false` in the [public contract](public/tet-noesis-contract.yaml)).                            |
| Authority scales with consequence | Four warrant tiers set the proof, uncertainty, verifier, and human-approval thresholds.                                                                                                                                         |
| Leases, not standing permissions  | Authority is a capability lease with a named scope, an explicit tool list, a bounded budget, an optional expiry, and an approval flag. Issuing a receipt revokes it.                                                            |
| Approval binds to content         | A human approval is bound to a fingerprint of the exact objective, state, evidence, tier, and lease it was given for. Any change voids it, and the kernel enforces this, not just the UI. Imported files never carry authority. |
| Fail closed                       | Missing state, expired or inactive leases, and failed evidence produce `BLOCK`. Unknown fields and malformed files are rejected at import. There is no default allow.                                                           |
| Every decision is explainable     | Every non-allow decision carries typed blocker codes (16 today), split into hard blocks and soft "needs more proof" holds.                                                                                                      |

## Architecture

```text
 Agent, model, or human (any provider)
        │  proposes an objective
        ▼
 ┌─────────────────────────────────────────────┐
 │ WORKSPACE  strict schema, unknown = reject  │
 │  canonical state  objective · state · tier  │
 │  evidence ledger  claim · source · weight · │
 │                   status · independent?     │
 │  capability lease scope · tools · budget ·  │
 │                   expiry · approval         │
 └──────────────────────┬──────────────────────┘
                        ▼
 ┌─────────────────────────────────────────────┐
 │ WARRANT KERNEL  pure, deterministic         │
 │  policy[tier] × coverage × uncertainty ×    │
 │  independence × lease × approval            │
 │  → ALLOW | VERIFY | BLOCK + typed blockers  │
 └──────────────────────┬──────────────────────┘
                 ALLOW  ▼
 ┌─────────────────────────────────────────────┐
 │ EXECUTION ADAPTER  dry_run only (today)     │
 │  receipt: evidence IDs · state revision ·   │
 │           coverage · lease · residual risk  │
 │  lease revoked · audit event appended       │
 └─────────────────────────────────────────────┘
```

### The decision kernel

```ts
evaluateWarrant(workspace, now) → {
  decision: "allowed" | "verify" | "blocked",
  coverage,                 // verified evidence weight ÷ total weight
  blockers: [{ code, message, hard }],
  independentVerification,
  verifiedCount,
  evidenceCount,
}
```

`evaluateWarrant` is a pure function. It performs no I/O and no model calls,
and time is an injected parameter. The same inputs always produce the same
decision, so every decision can be replayed, unit-tested, and diffed. Any hard
blocker yields `blocked`. Soft blockers alone yield `verify`. No blockers yields
`allowed`.

### Warrant policies

| Tier     | Proof coverage | Max uncertainty | Independent proof | Human approval |
| -------- | -------------- | --------------- | ----------------- | -------------- |
| Low      | 60%            | 40%             | Optional          | No             |
| Medium   | 80%            | 25%             | Required          | No             |
| High     | 90%            | 15%             | Required          | Required       |
| Critical | 100%           | 10%             | Required          | Required       |

### Receipts

A receipt can only be issued from an `allowed` decision. Issuing it records the
authorizing state and revokes the lease in the same transition. Abridged
example:

```json
{
  "schemaVersion": "1.0.0",
  "receiptId": "receipt-3f9c1a2b-7d4",
  "decision": "allowed",
  "result": "dry_run_completed",
  "warrantLevel": "medium",
  "canonicalStateRevision": "2026-10-21T18:02:11.000Z",
  "coverage": 1,
  "uncertainty": 0.18,
  "verifiedEvidenceIds": [
    "evidence-repo-state",
    "evidence-policy-gate",
    "evidence-preview-proof"
  ],
  "independentVerification": true,
  "authorityFingerprint": "fnv1a64:9c1e4f7a2b83d605",
  "residualRisk": "External execution remains disabled; this receipt records a local dry run only."
}
```

### Source map

| Layer                     | Source                                                               | What to look for                                                                              |
| ------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Trust boundary            | [`src/lib/noesis-schema.ts`](src/lib/noesis-schema.ts)               | Strict Zod objects, bounded sizes, versioned schema                                           |
| Decision kernel           | [`src/lib/noesis.ts`](src/lib/noesis.ts)                             | `evaluateWarrant`, `warrantPolicies`, `issueDryRunReceipt`                                    |
| Content-bound approvals   | [`src/lib/noesis.ts`](src/lib/noesis.ts)                             | `authorityFingerprint`, `reconcileApproval`, `stripImportedAuthority`                         |
| Revision-bound packets    | [`src/lib/exchange/model.ts`](src/lib/exchange/model.ts)             | `packetApprovalValid`, `importWorkspace` (imports strip authority)                            |
| Encrypted vault           | [`src/lib/exchange/vault.ts`](src/lib/exchange/vault.ts)             | AES-256-GCM, PBKDF2-SHA256, authenticated format binding, input bounded before key derivation |
| Machine-readable contract | [`public/tet-noesis-contract.yaml`](public/tet-noesis-contract.yaml) | The policy as data: tiers, authority rules, execution limits                                  |
| Agent operator package    | [`skills/govern-tet-noesis/`](skills/govern-tet-noesis/SKILL.md)     | A provider-neutral skill that applies the same warrant loop inside coding agents              |
| Tests                     | [`src/lib/**/*.test.ts`](src/lib/noesis.test.ts)                     | Policy, schema, approval-binding, and fail-closed cryptography cases                          |

## Reference applications

Two applications run on the same kernel. Together they show that the kernel is
domain-neutral: one governs software work, the other governs a workflow with
money and legal documents.

**Noesis workbench (`/noesis`).** Author canonical state, evidence, and leases;
run the kernel live; inspect every blocker; export the workspace and receipts
as strictly validated JSON. Granting approval binds it to the current content;
editing anything it vouches for revokes it and records why. Product boundary:
[`docs/product/TET_NOESIS.md`](docs/product/TET_NOESIS.md).

**TrueNorth Exchange (`/exchange`).** A property acquisition workspace governed
by the same kernel. It covers mandate and asset intake, NOI, cash-flow,
cap-rate, and occupancy-stress comparisons, and diligence gaps by category. A
review packet requires an approval bound to the current asset and mandate
revisions; editing either one revokes it. Checkpoints and exports are encrypted
with AES-256-GCM using a PBKDF2-SHA256 key. Listing feeds, legal review,
e-signature, and settlement providers are deliberately unconnected. Product
boundary: [`docs/product/TRUENORTH_EXCHANGE.md`](docs/product/TRUENORTH_EXCHANGE.md).

## Built under its own rules

The agents that build this repository operate under the same discipline the
product enforces.

- [`AGENTS.md`](AGENTS.md) requires a fixed flow: intent, repo map, impact
  analysis, plan, implementation, verification, receipt, and human-gated
  release.
- [`.claude/settings.json`](.claude/settings.json) starts agents in plan mode,
  requires approval for edits, installs, and commits, and denies `git push`,
  production deploys, secret reads, and destructive shell commands outright.
- 12 specialist agent roles live in [`agents/`](agents/) and 9 repo-native task
  procedures live in [`skills/`](skills/).
- Every pull request must pass formatting, tests, lint, type-checking, and a
  production build in [CI](.github/workflows/ci.yml).

## What's shipped and what's next

**Shipped**

| Capability                                                     | Status  |
| -------------------------------------------------------------- | ------- |
| Deterministic warrant kernel with four policy tiers            | Shipped |
| Strict, versioned schemas for workspaces, leases, and receipts | Shipped |
| Capability leases with expiry, budget, approval, auto-revoke   | Shipped |
| Dry-run receipts and a bounded local audit trail               | Shipped |
| Content-bound human approvals, enforced in the kernel          | Shipped |
| Encrypted local vault for Exchange workspaces                  | Shipped |
| Provider-neutral agent skill and governor role                 | Shipped |
| CI gate: format, 27 unit tests, lint, type-check, build        | Shipped |

**Next: the path to a production kernel**

1. Shared, tenant-aware canonical state with signed, append-only receipts.
2. Adapter contracts for model proposals and independent verifiers such as CI
   results, test runs, browser checks, and second-model review, so evidence is
   attested by machines instead of declared by operators.
3. Server-enforced policy decisions, leases, and revocation at the tool
   boundary, for example as a gateway in front of agent tool calls.
4. Sandbox-only execution with protected tests, observability, and rollback.
5. Governed shared memory with provenance, retention, and contradiction
   tracking.
6. Human approval, canary release, and monitored rollback before any production
   action.

Each step ships with its own threat model, RBAC, data, API, and test update.

## Known limits

These are stated plainly so that technical review starts from facts.

- Evidence status and verifier independence are declared by the operator today.
  They are not yet machine-attested (roadmap step 2).
- Uncertainty is an explicit operator input, not a model-calibrated estimate.
- State lives in the browser. A local approval is not a security boundary
  against someone who controls that browser. Real effects require a
  server-authoritative system (roadmap step 3).
- Receipts are structured records. They are not yet cryptographically signed
  (roadmap step 1).
- Approval fingerprints detect ordinary edits to protected content, subject to
  hash collisions. Evidence observation timestamps are excluded; freshness is
  not evaluated. These non-cryptographic hashes are not signatures, so they do
  not prove who approved or resist deliberate tampering (roadmap step 1).
- Reactivating an unchanged lease can issue another dry-run receipt without
  fresh approval. Receipts do not confer single-use execution authority.
- There is no authentication, tenancy, or telemetry yet.

## Quick start

Requirements: Node.js 20 or newer, and Corepack (the repository pins pnpm 10).

```bash
git clone https://github.com/dvdmrtnz15-afk/founders-lab-os.git
cd founders-lab-os
pnpm install
pnpm dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000). The kernel workbench is at
`/noesis` and Exchange is at `/exchange`.

To test on a phone on the same network, run `pnpm dev:phone` and open
`http://YOUR_MAC_IP:3000` on the device.

## Validation loop

CI runs the same four checks on every pull request:

```bash
pnpm format:check
pnpm test
pnpm lint
pnpm build
```

## Repository map

```text
src/lib/            Kernel, schemas, Exchange model, vault, and tests
src/app/            Next.js routes: /, /noesis, /exchange
public/             Machine-readable TET Noesis contract
agents/             Specialist agent roles
skills/             Repo-native task procedures and the Noesis skill
docs/product/       Product intent, boundaries, acceptance criteria
docs/architecture/  ADRs and C4 context, container, component views
docs/security/      Threat model, secrets, auth, and RBAC policy
docs/testing/       Test strategy and agent evaluations
docs/ops/           Release, observability, and runbooks
docs/receipts/      Implementation plans and change receipts
```

## Contributing and security

- Read [`CONTRIBUTING.md`](CONTRIBUTING.md) before proposing changes.
- Use the issue templates for bugs, features, and architecture changes.
- Report vulnerabilities through the private process in
  [`SECURITY.md`](SECURITY.md), not a public issue.

## License

No open-source license has been granted. The source is published for review
and evaluation. Copying, modifying, or redistributing it requires written
permission from the copyright holder.

---

Built by David Martinez, TrueNorth Applications, Chicago.
