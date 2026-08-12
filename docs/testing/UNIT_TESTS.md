# Unit Tests

Vitest 4 runs the TypeScript policy and contract suite:

```bash
pnpm test
```

`src/lib/noesis.test.ts` covers:

- medium-risk proof and uncertainty holds;
- allowed decisions after sufficient proof;
- inactive lease and incomplete objective blocks;
- required high-risk human approval;
- strict JSON round trips and invalid import rejection;
- dry-run receipt creation and automatic lease revocation;
- refusal to issue a receipt without an allowed decision.
