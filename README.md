# FounderLab OS

FounderLab OS is a public-source, local-first build cockpit for governed AI
agent workflows. It turns planning, repository evidence, model routing,
verification, preview checks, GitHub handoff, and release gates into one visible
operating surface.

> Status: reference implementation. The current UI demonstrates the operating
> model; it does not execute production actions or provide a persistent agent
> backend.

## Why it exists

AI coding tools are fast, but speed without evidence creates duplicate features,
hidden backend behavior, unsafe releases, and weak handoffs. FounderLab OS keeps
the important control points visible:

- map the repository before editing;
- separate proposals from permission to act;
- expose uncertainty and the blocking subproblem;
- require independent verification for consequential actions;
- keep production, secrets, auth, payments, and destructive actions gated;
- leave a receipt that explains what changed, what passed, and how to roll back.

## TET Noesis™ preview

`/noesis` is an interactive reference workbench for warranted autonomy:

> Think recursively. Know what is uncertain. Act only with proof.

The preview demonstrates canonical state, calibrated uncertainty,
impasse-driven recursion, an evidence ledger, independent verification,
semantic capability leases, TET Resolve, governed memory, and execution
receipts. It runs entirely in the browser with sample state and performs no
external action.

The public reference contract is available at
[`public/tet-noesis-contract.yaml`](public/tet-noesis-contract.yaml), with the
product boundary documented in
[`docs/product/TET_NOESIS.md`](docs/product/TET_NOESIS.md).

## Quick start

Requirements:

- Node.js 20 or newer
- Corepack (the repository pins pnpm 10 for Node.js 20 compatibility)

```bash
git clone https://github.com/dvdmrtnz15-afk/founders-lab-os.git
cd founders-lab-os
pnpm install
pnpm dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000). The Noesis workbench is at
[http://127.0.0.1:3000/noesis](http://127.0.0.1:3000/noesis).

For phone QA on the same network:

```bash
pnpm dev:phone
```

Then open `http://YOUR_MAC_IP:3000` from the device.

## Validation loop

```bash
pnpm format:check
pnpm lint
pnpm build
```

## Repository map

```text
src/app/          Next.js routes and visible product surfaces
src/lib/          Deterministic domain logic
agents/           Specialist agent role instructions
skills/           Repo-native task procedures
docs/product/     Product intent and acceptance criteria
docs/architecture Architecture decisions and system boundaries
docs/design/      Route, component, and UX inventories
docs/security/    Threat, secrets, auth, and RBAC policies
docs/testing/     Test strategy and future test layers
docs/ops/         Release, observability, and runbook baselines
```

## Governance

Start with [`AGENTS.md`](AGENTS.md). Its non-negotiable flow is:

```text
intent -> repo map -> architecture/UI/data/security impact -> plan
       -> implementation -> verification -> receipt -> human-gated release
```

Hard gates:

- never read or expose real secrets;
- never add a dependency without explaining and approving it;
- never change auth, payments, production, or user-data boundaries casually;
- never push or deploy without explicit approval;
- never claim completion without running the relevant checks;
- use a preview before production and keep rollback evidence.

The model names and launch commands shown in the cockpit are adapter examples,
not runtime requirements. Replace them with the local or hosted model profiles
appropriate to your environment.

## Contributing and security

- Read [`CONTRIBUTING.md`](CONTRIBUTING.md) before proposing changes.
- Use the issue templates for bugs, features, and architecture changes.
- Report vulnerabilities through the private process in
  [`SECURITY.md`](SECURITY.md), not a public issue.

## License

No software license has been selected yet. Public visibility alone does not
grant permission to copy, modify, or redistribute the project. A license should
be chosen deliberately before describing this repository as open source.
