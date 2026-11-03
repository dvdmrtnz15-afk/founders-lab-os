# Auth Model

Authentication is implemented for live expert answers: GitHub OAuth through
Auth.js v5, JWT sessions, an allowlist for spend, and per-user and daily
limits. Everything else remains public.

- Decision record: `docs/architecture/ADR/0002-github-sign-in-for-expert-spend.md`
- How it works and operator setup: `docs/architecture/AUTH.md`

Any new protected surface must call `requireSession()` (or `getPrincipal()`)
on the server itself; there is no middleware gate to rely on. Spending the
operator's keys additionally requires `expertAccess()` to return `allowed`.
