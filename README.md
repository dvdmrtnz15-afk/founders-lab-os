# founders-lab-os

Private AI founder lab for a composer-first build cockpit: VS Code meets Cursor
meets Replit, with Codex-grade governed agent workflows, local model routing,
GitHub checkpoints, product audits, monetization systems, and reusable build
playbooks.

## Operating Model

This repo is the main Mac-first FounderLab cockpit:

```txt
MacBook Pro
  -> VS Code
  -> GitHub Copilot inline assistance
  -> Claude Code governed edits
  -> Continue local model chat/edit/apply
  -> Roo Code local experiments
  -> Ollama model lane
  -> Ollama launch agents
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

## Composer Experience

The core surface should feel like VS Code meets Cursor meets Replit Agent:

- Plan mode is first-class: understand, propose, wait for approval, execute.
- Uploadable context is visible in the composer: files, repo slices, URLs,
  screenshots, specs, issues, and preview evidence.
- The composer owns intent, plan approval, model routing, terminal checks, live
  preview, GitHub handoff, and PR preparation.
- The right rail keeps ship controls close: local launch agents, Copilot, GitHub,
  Vercel preview, and production approval gates.

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
- Keep Copilot as an inline assistant; use Continue/Ollama for private local
  model reasoning and Claude Code/Codex for governed repo changes.
- Local launch agents are explicit cockpit lanes: `ollama launch codex`,
  `ollama launch claude`, `ollama launch codex-app`, and
  `ollama launch hermes`.
- Before using the ChatGPT GitHub connector, check
  `docs/codex/github-connector-visibility.md`; the current connector may not
  expose this repo.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- ESLint
- Prettier
- pnpm
