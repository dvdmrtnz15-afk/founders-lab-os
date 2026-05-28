# ADR 0001: Agentic Software Factory OS

## Status

Accepted.

## Context

FounderLab OS needs AI agents to behave more like a mature software team than a
single prompt-to-code assistant.

## Decision

Use a repo-native operating system made of `AGENTS.md`, specialist files under
`/agents`, task skills under `/skills`, and durable docs under `/docs`.

## Consequences

- Agents must map the repo before code changes.
- Every meaningful change needs a plan, test path, rollback path, and receipt.
- Security-sensitive areas require elevated review.
- Future automation can enforce the same artifacts in CI and PR review.
