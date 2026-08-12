# System Overview

FounderLab OS is currently a Next.js App Router application with TypeScript,
React, Tailwind CSS, ESLint, Prettier, and pnpm.

## Runtime Shape

- Frontend: `src/app/page.tsx` renders the focused command center.
- Noesis harness: `src/app/noesis/*` renders the editable, responsive proof-first
  workspace.
- Domain logic: `src/lib/noesis.ts` evaluates warrant state and issues dry-run
  receipts without network or model dependencies.
- Runtime contracts: `src/lib/noesis-schema.ts` uses Zod 4 to validate versioned
  workspace, lease, evidence, audit, and receipt objects.
- Local persistence: the client stores one validated workspace under a versioned
  local-storage key and supports explicit JSON import, export, and reset.
- Unit tests: Vitest exercises deterministic policy and contract behavior.
- Layout: `src/app/layout.tsx` provides metadata and global font setup.
- Styles: `src/app/globals.css` defines Tailwind import and global defaults.
- Docs: `docs/` captures product, architecture, security, testing, ops, memory,
  and receipts.
- Agent system: `AGENTS.md`, `/agents`, and `/skills` define repo-native
  operating behavior.

## Current Constraints

- No backend API routes are present yet.
- No database or migration system is present yet.
- No auth/RBAC implementation is present yet.
- The Noesis harness cannot execute external actions and exposes only a local
  dry-run adapter.
- Browser-local storage is neither shared nor tenant-aware and must not be
  treated as an enterprise system of record.
- Production deploys remain gated by human review.

## Architecture Principle

Keep the architecture boring and visible. Add new layers only when a product
workflow proves they are needed, and document each structural decision with an
ADR.
