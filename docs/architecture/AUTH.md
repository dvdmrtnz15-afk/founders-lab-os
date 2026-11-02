# Authentication

Status: **active for live expert answers.** Decision record:
`docs/architecture/ADR/0002-github-sign-in-for-expert-spend.md`.

GitHub OAuth through Auth.js v5, JWT sessions, no database. Passwords are
deliberately absent: GitHub owns credential handling, MFA, and breach
response.

## What is protected

| Surface                        | Rule                                                                          |
| ------------------------------ | ----------------------------------------------------------------------------- |
| `POST /api/experts/consult`    | Signed in **and** on the allowlist **and** within spend limits                |
| "Ask the expert" on `/experts` | Shown only when the server says the visitor is allowed; the endpoint enforces |
| Everything else                | Public, unchanged                                                             |

The UI state is a convenience. The endpoint checks everything itself, in this
order, and nothing reaches Claude until all pass: same origin, JSON body,
auth configured, signed in, allowlisted, valid task (3 to 4,000 characters,
no extra fields), spend limit. Upstream errors return generic messages; details
stay in server logs, which record event, user id, expert, and status, never
the task text or upstream error message.

## Enforcement layers

1. **`requireSession()` / `getPrincipal()`** in `src/lib/auth/session.ts`
   (`server-only`). The authoritative identity check.
2. **`expertAccess()`** in `src/lib/auth/access.ts`. Identity is not
   permission to spend: the GitHub numeric id must be on
   `EXPERT_ALLOWED_GITHUB_IDS`. Numeric ids are used because usernames can be
   changed and re-registered.
3. **`createSpendGuard()`** in `src/lib/experts/spend-guard.ts`. Per-user
   hourly and deployment-wide daily caps, checked and recorded atomically.
4. **`authorizeOwnership()`** in `src/lib/auth/authorization.ts`. Per-resource
   guard for the first user-owned data. Denials return `NOT_FOUND`, never
   `FORBIDDEN`, so endpoints cannot be used to enumerate resources.

There is no middleware or proxy gate; every protected entry point checks the
session itself.

## Operator setup

Set these on the host (for Vercel: Project Settings, Environment Variables).
Never commit values.

| Variable                       | Value                                                        |
| ------------------------------ | ------------------------------------------------------------ |
| `AUTH_SECRET`                  | `openssl rand -base64 32`                                    |
| `AUTH_GITHUB_ID`               | GitHub OAuth app client id                                   |
| `AUTH_GITHUB_SECRET`           | GitHub OAuth app client secret                               |
| `AUTH_URL`                     | Production origin, for example `https://your-domain.example` |
| `EXPERT_ALLOWED_GITHUB_IDS`    | Comma-separated GitHub numeric user ids allowed to spend     |
| `ANTHROPIC_API_KEY`            | The key live answers bill to                                 |
| `EXPERT_MAX_PER_USER_PER_HOUR` | Optional, default 10                                         |
| `EXPERT_MAX_PER_DAY`           | Optional, default 100                                        |

Create the OAuth app at GitHub, Settings, Developer settings, OAuth Apps, New
OAuth App. Authorization callback URL: `<origin>/api/auth/callback/github`.

Find a GitHub numeric id with `https://api.github.com/users/<username>` (the
`id` field).

## Verification

- `pnpm test` covers the gates, allowlist, redirect safety, and spend guard.
- `pnpm test:live` runs one real consultation against Claude. It costs money,
  is excluded from `pnpm test` and CI, and is skipped without credentials.
- Operator checks needing real credentials: full sign-in round trip, session
  survives refresh, a non-allowlisted account sees the allowlist message, and
  the live answer renders with its review verdict.

## Limits

- JWT sessions cannot be revoked early (24h maximum); remove the id from the
  allowlist to stop spend immediately.
- Spend counters are per server instance (see the ADR).
- Auth.js v5 is a pinned beta.
