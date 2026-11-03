# ADR 0002: GitHub sign-in gates live expert spend

- Status: Accepted
- Date: 2026-11-02
- Decider: repository owner (requested "login first" before an "ask the
  expert" button)

## Context

The Expert Desk can call Claude for real. A public endpoint that does so
spends the operator's API key, and the app had no authentication, so anyone
with the URL could run up the bill. An earlier Auth.js design
(`feat/auth-foundation`, commit `1a8d250`) was approved through the
`AGENTS.md` CLOUD gate and left dormant.

## Decision

Adopt that design and add spend controls on top:

| Concern            | Decision                                                                                                   |
| ------------------ | ---------------------------------------------------------------------------------------------------------- |
| Provider           | GitHub OAuth through Auth.js v5 (`next-auth@5.0.0-beta.32`, pinned exactly)                                |
| Session model      | JWT cookie, 24h maximum, no database                                                                       |
| Authorization      | Signing in is not enough: an allowlist of GitHub numeric ids (`EXPERT_ALLOWED_GITHUB_IDS`), empty = nobody |
| Spend limits       | Per user per hour and per deployment per day, checked before any Claude call                               |
| Middleware / proxy | None. Every protected server entry point checks the session itself                                         |
| Public surfaces    | Unchanged: `/`, `/noesis`, `/exchange`, and the Expert Desk routing preview stay public                    |
| Local development  | Without credentials the app builds and runs; sign-in and live answers show "not configured"                |

## Consequences

- A JWT session cannot be revoked before it expires (24h at most). Removing a
  GitHub id from the allowlist takes effect immediately, which is the
  practical revocation lever for spend.
- Spend counters live in process memory, so each serverless instance counts
  separately and a cold start resets them. Acceptable for a small allowlist;
  move to a shared store before widening access.
- Auth.js v5 is a beta release. It is pinned exactly; upgrades are deliberate.

## Test strategy

Unit tests cover the env contract, ownership (including the cross-user case),
the allowlist, safe post-sign-in redirects, the spend guard, and every gate on
the endpoint. A production-build browser check covers the unconfigured and
configured-anonymous states and confirms the GitHub authorization redirect.
The full OAuth round trip needs real credentials and is an operator check.
