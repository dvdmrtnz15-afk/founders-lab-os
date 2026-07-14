# Test Strategy

## Current Checks

```bash
pnpm format:check
pnpm test
pnpm lint
pnpm build
```

## Current Automated Coverage

- Vitest unit tests for warrant thresholds, hard authority blocks, approval
  requirements, strict workspace parsing, round trips, receipts, and lease
  revocation.

## Future Test Layers

- Integration tests for API and data flows.
- E2E tests for critical user journeys.
- Accessibility checks for UI surfaces.
- Security tests for auth, RBAC, and validation.
- Agent evals for workflow compliance.
