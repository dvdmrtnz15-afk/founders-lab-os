# FounderLab OS PRD

## Product Intent

FounderLab OS is a governed build cockpit for founder-led software work. It
turns elite software-team behavior into an agent-followable operating system:
repo cartography, product intent, architecture review, design surfacing,
implementation, testing, security review, release readiness, and receipts.

## Target User

- A technical founder building multiple SaaS and product experiments.
- AI coding agents operating inside the repository.
- Reviewers who need durable evidence of what changed and why.

## Problem

AI coding workflows often jump from request to patch. That creates duplicate
files, hidden backend features, broken UI paths, weak tests, and security drift.

## Scope

- Governed agent workflow.
- Repository maps and implementation receipts.
- Specialist agent instructions.
- Skill-based task procedures.
- Product, architecture, design, data, API, security, testing, and ops docs.
- An operational TET Noesis local harness for authoring, validating, persisting,
  auditing, importing, exporting, and receipting proof-gated agent decisions.

## Non-Goals

- Replacing human review for high-risk changes.
- Reading secrets or production data.
- Deploying directly to production.
- Building a shared enterprise control plane before tenancy, RBAC, policy,
  adapter, and data contracts are approved.
- Presenting a browser-local governance harness as a persistent autonomous
  execution runtime.

## Acceptance Criteria

- New agents can find the rules in `AGENTS.md`.
- Specialist roles exist in `/agents`.
- Task procedures exist in `/skills`.
- Core software-factory documents exist under `/docs`.
- PRs include risk, surfacing, tests, rollback, and receipt evidence.
- Operators can complete a governed Noesis dry run without a model provider or
  backend.
- Invalid imported workspace data is rejected before it becomes canonical.
- Consequential warrant levels require independent proof and explicit approval.
