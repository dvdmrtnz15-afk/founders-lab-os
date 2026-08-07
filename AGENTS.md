# FounderLab Agent Constitution

This repository is a governed-agent-first product workspace. Agents should act
like a disciplined software team: understand intent, map the repo, plan the
change, implement the smallest safe patch, verify it, and leave a receipt.

## Routing

Declare the routing tier before work:

```txt
[ROUTING: TIER - reason]
```

- FAST: quick lookup, short draft, trivial edit.
- CODE: multi-file edit, feature implementation, debug session.
- REASON: architecture decision, hard debugging, complex tradeoff.
- POWER: large refactor, full repo analysis, very long context.
- VISION: screenshots, UI mockups, image analysis.
- CLOUD: secrets, auth, payments, production deploy, compliance.

Escalate secrets, auth, payments, production deploys, and compliance-sensitive
work for explicit human review before touching files.

## TET Noesis Governance

Use `skills/govern-tet-noesis/SKILL.md` and the
`agents/noesis-governor.agent.md` role for consequential, uncertainty-heavy,
cross-system, destructive, persistent-memory, or self-improvement work. Require
a proof-gated `ALLOW`, an active scoped capability lease, independent
verification proportional to risk, and an execution receipt before claiming a
bounded action succeeded.

The Noesis workflow adds a warrant gate; it never replaces the stricter rule in
this constitution or grants authority the operator did not provide.

## Required Pre-Code Output

No meaningful code change starts until the agent has produced:

1. Repo map.
2. Affected-file list.
3. Architecture impact.
4. UI surfacing plan.
5. Backend/data impact.
6. Test plan.
7. Rollback plan.

## Repo Cartography Checklist

Before editing, inspect and summarize:

- Framework, package manager, scripts, and build tools.
- Routes/pages and visible UI surfaces.
- Components, services, middleware, policies, jobs, and shared libraries.
- API endpoints, database/schema files, migrations, and data boundaries.
- Auth/RBAC, environment variables, secrets policy, and security-sensitive code.
- Existing tests, docs, receipts, open changes, and current branch.
- Files that are likely affected and files that must not be touched.

## Development Invariants

- Never code before mapping the repo.
- Never duplicate an existing feature, route, component, service, schema, or
  prompt.
- Never add backend functionality without identifying the user, admin, API, or
  explicitly internal surface.
- Never add a dependency without explaining why existing dependencies are not
  enough.
- Never modify auth, payments, user data, tenant boundaries, secrets, or
  production config without elevated review.
- Never create a database migration without rollback notes and data impact.
- Never ignore failing checks.
- Never mark work complete without an implementation receipt.
- Never push, deploy, publish, or make external changes without explicit
  approval.

## Standard Workflow

```txt
REQUEST_RECEIVED
  -> INTENT_CLASSIFICATION
  -> REPO_CARTOGRAPHY
  -> PRODUCT_REQUIREMENT_CHECK
  -> ARCHITECTURE_IMPACT_CHECK
  -> DESIGN_AND_UI_SURFACING_CHECK
  -> DATA_AND_API_CONTRACT_CHECK
  -> SECURITY_RBAC_PRIVACY_CHECK
  -> IMPLEMENTATION_PLAN
  -> HUMAN_APPROVAL_IF_RISKY
  -> CODE_CHANGE
  -> SELF_REVIEW
  -> SPECIALIST_AGENT_REVIEW
  -> TEST_EXECUTION
  -> SECURITY_SCAN
  -> DOCS_UPDATE
  -> RELEASE_RECEIPT
  -> MERGE_OR_REVISE
```

## Verification Commands

Use the narrowest relevant check, then broaden for cross-cutting changes.

```bash
pnpm format:check
pnpm lint
pnpm build
```

Use `pnpm dev:phone` for mobile preview on the local network when UI changes
affect responsive layout.

## Receipt Format

Every task ends with:

```txt
Implementation Receipt
Task:
Risk Tier:
Repo Areas Inspected:
Files Changed:
Files Created:
Architecture Impact:
Frontend Surface:
Backend/API Impact:
Database Impact:
RBAC/Security Impact:
Tests Added:
Tests Run:
Docs Updated:
Known Limitations:
Rollback Plan:
Next Recommended Action:
Reviewer Agent Verdict:
```

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
