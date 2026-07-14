# System Overview

FounderLab OS is currently a Next.js App Router application with TypeScript,
React, Tailwind CSS, ESLint, Prettier, and pnpm.

## Runtime Shape

- Frontend: `src/app/page.tsx` renders the cockpit UI.
- Noesis workbench: `src/app/noesis/*` renders the interactive proof-first
  reference loop.
- Domain logic: `src/lib/noesis.ts` evaluates warrant state without network,
  storage, or model dependencies.
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
- The Noesis workbench uses in-memory sample state and cannot execute external
  actions.
- Production deploys remain gated by human review.

## Architecture Principle

Keep the architecture boring and visible. Add new layers only when a product
workflow proves they are needed, and document each structural decision with an
ADR.
