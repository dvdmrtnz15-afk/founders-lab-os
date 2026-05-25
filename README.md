# founders-lab-os

Private AI founder lab for governed agent workflows, local model routing,
product audits, monetization systems, and reusable build playbooks.

## Operating Model

This repo is the main Mac-first FounderLab cockpit:

```txt
MacBook Pro
  -> VS Code
  -> Claude Code governed edits
  -> Continue autocomplete
  -> Roo Code local experiments
  -> Ollama model lane
  -> iPhone QA
  -> GitHub checkpoint
  -> Vercel preview
  -> production only after review
```

## Daily Loop

```bash
pnpm format:check
pnpm lint
pnpm build
pnpm dev:phone
```

Open local preview:

```txt
http://127.0.0.1:3000
```

Open phone preview from the same Wi-Fi:

```txt
http://YOUR-MAC-IP:3000
```

## Governance

- `.claude/CLAUDE.md` is the repo operating constitution.
- `.claude/settings.json` keeps Claude Code in plan-first mode.
- `.claude/skills` contains feature, review, security, UX, and release workflows.
- `docs/receipts/agent-edits.jsonl` stores agent edit receipts.
- Durable cross-project memory lives in `~/FounderLab/memory`.

Hard gates:

- Do not read `.env` files without explicit approval.
- Do not push to GitHub without explicit approval.
- Do not deploy production without explicit approval.
- Do not add dependencies without approval.
- Do not let multiple agents edit at the same time.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- ESLint
- Prettier
- pnpm
