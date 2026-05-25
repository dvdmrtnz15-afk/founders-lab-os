# Project Memory

## Identity

`founders-lab-os` is the real GitHub-backed repo for the FounderLab operating
system.

## Role

The app is the main cockpit for the governed local build loop:

- Mac-first development
- Claude Code as senior governed repo agent
- Continue for autocomplete and quick context
- Roo Code for low-risk local tasks
- Ollama for local reasoning/model routing
- iPhone preview before external review
- GitHub checkpointing
- Vercel previews before production

## Current Surface

The root route is a FounderLab cockpit dashboard, not the stock Next.js starter.

## Commands

```bash
pnpm format:check
pnpm lint
pnpm build
pnpm dev:phone
```

## Hard Gates

- No `.env` access unless explicitly authorized.
- No GitHub push without explicit approval.
- No production deploy without explicit approval.
- No dependency changes without approval.
