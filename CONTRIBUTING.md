# Contributing

FounderLab OS uses a governed agent workflow. The goal is not just to produce
code, but to preserve product intent, architecture clarity, security, tests,
and release evidence.

## Before Editing

- Confirm only one agent is editing.
- Run `git status --short --branch`.
- Read `AGENTS.md`, `README.md`, and the relevant docs under `docs/`.
- Produce repo cartography, affected files, risk tier, test plan, and rollback
  plan before changing files.

## Pull Request Standard

Every PR should include:

- Problem and user impact.
- Files changed and why.
- Frontend surface or reason the change is intentionally internal.
- Backend/API/data impact.
- RBAC/security impact.
- Tests and checks run.
- Rollback plan.

## Checks

Run the most relevant checks before handoff:

```bash
pnpm format:check
pnpm lint
pnpm build
```

For UI changes, preview desktop and mobile layouts before merge.
