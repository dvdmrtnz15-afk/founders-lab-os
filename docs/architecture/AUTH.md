# Authentication

Status: **foundation complete, dormant.** No route is protected yet.

```txt
[ROUTING: CLOUD - authentication, secrets, session handling]
```

Approved under the `AGENTS.md` CLOUD gate. The pre-code submission (repo map,
affected files, architecture, UI, data, tests, rollback) was reviewed and
received `ALLOW`.

## Decision

**GitHub OAuth + JWT sessions, no database.**

This repository has no persistence layer. Database-backed sessions would mean
introducing Drizzle, Postgres, and migrations — a change substantially larger
than the auth itself, and one that lands in the middle of active Noesis work.
JWT sessions need zero storage.

**The tradeoff, stated because code cannot show it: a JWT session cannot be
revoked before it expires.** `SESSION_MAX_AGE_SECONDS` caps that at 24 hours. If
instant revocation becomes a requirement — suspending an account, forcing
sign-out — migrate to `strategy: "database"` plus an adapter. `getPrincipal()`
in `src/lib/auth/session.ts` is the seam that keeps every caller unchanged.

Passwords are deliberately absent. GitHub owns credential handling, MFA, and
breach response; re-implementing any of that here would be strictly worse.

## Enforcement layers

Three, and none is redundant.

1. **`middleware.ts`** — coarse redirect so anonymous traffic sees a sign-in page
   rather than an empty shell. This is UX, *not* security: anything reaching a
   route handler directly bypasses it. **Currently dormant** (see below).
2. **`requireSession()`** — called by every protected Server Component and Server
   Action. This is the check that actually holds.
3. **Ownership predicates** — `authorizeOwnership()` in
   `src/lib/auth/authorization.ts`. A session proves *who* someone is; it says
   nothing about whether a given row is theirs. No user-owned data exists yet, so
   this ships as a tested guard ahead of the first query that needs it.

Denials for unowned resources return `NOT_FOUND`, never `FORBIDDEN` —
`FORBIDDEN` confirms existence and turns the endpoint into an enumeration
oracle.

## Why the middleware is dormant

`/noesis` is public today. Protecting it is a user-visible behavior change that
was flagged as needing separate explicit approval and has not received it. The
project's product standard also lists "hidden value behind login" under things
to avoid, which is an argument for leaving it public on the merits.

To activate, in `middleware.ts`:

```ts
export const config = { matcher: ["/noesis/:path*"] };
```

That is the whole change. Auth ships complete and inert until someone decides it
should not be.

## Configuration

Absent credentials, the app builds and runs normally and `/sign-in` renders an
explicit "not configured" state. This is deliberate: a hard throw at import time
would take down `next build` and every route on a machine that simply has no
secrets yet, which is the normal state of this repo.

Environment contract is `authEnvSchema` in `src/lib/auth/env.ts`; key names live
in `.env.example`. Validation failures report *which keys* failed and never their
values — an error message is a log line, and a log line is somewhere a secret
must never land.

## Files

```
middleware.ts                              dormant route gate
src/lib/auth/env.ts                        Zod env contract, lazy + non-throwing
src/lib/auth/authorization.ts              pure predicates, no framework imports
src/lib/auth/config.ts                     Auth.js setup, JWT strategy
src/lib/auth/session.ts                    getPrincipal / requireSession / requireOwnership
src/lib/auth/auth.test.ts                  13 tests incl. the cross-user guard
src/app/api/auth/[...nextauth]/route.ts    handler re-export
src/app/(auth)/sign-in/page.tsx            sign-in surface, 4 states
src/app/(auth)/sign-in/submit-button.tsx   client boundary for pending state
```

`src/app/layout.tsx` was **not** modified — no client component needs the
session, so no `SessionProvider` is required. The only edited file is
`package.json`.

## Verification

Automated (`pnpm test`) covers the env contract and the authorization
predicates, including the cross-user case: user B acting on user A's resource
must fail closed. That test is the one that protects every query added later.

Manual checks that require real credentials — full sign-in round trip, session
survives refresh, tampered cookie rejected, no protected data in page source —
are listed in the delivery summary and **have not been run**, because no
credentials exist in this environment.

## Rollback

All work is on `feat/auth-foundation`, branched from `codex/noesis-public`, with
an `fl baseline` snapshot taken beforehand. Revert = delete the branch. No
migrations exist, so there is no data rollback to get wrong.
