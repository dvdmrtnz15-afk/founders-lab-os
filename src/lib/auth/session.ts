import "server-only";
import { redirect } from "next/navigation";
import { auth } from "./config";
import { isAuthConfigured } from "./env";
import { authorizeOwnership, toPrincipal, type Principal } from "./authorization";

export type { Principal };

/**
 * Resolve the current principal, or null when anonymous.
 *
 * `server-only` is imported above so that a future refactor cannot pull this
 * into a client bundle — that would ship session handling to the browser, which
 * is precisely the mistake this module exists to prevent.
 */
export async function getPrincipal(): Promise<Principal | null> {
  // Short-circuit before touching Auth.js. Without a secret, `auth()` raises
  // MissingSecret internally and logs an error on every single render — noise
  // that would train everyone to ignore auth errors. Unconfigured genuinely
  // means nobody is signed in, so null is the correct answer, not a workaround.
  if (!isAuthConfigured()) return null;
  const session = await auth();
  return toPrincipal(session?.user);
}

/**
 * Require a signed-in principal in a Server Component or Server Action.
 *
 * Middleware already redirects anonymous traffic away from protected routes,
 * but middleware is routing, not security: anything reaching a handler directly
 * bypasses it. This is the check that actually holds.
 */
export async function requireSession(from?: string): Promise<Principal> {
  const principal = await getPrincipal();
  if (!principal) {
    redirect(from ? `/sign-in?from=${encodeURIComponent(from)}` : "/sign-in");
  }
  return principal;
}

/**
 * Guard a mutation against a resource the caller does not own.
 *
 * Prefer expressing ownership directly in the query's WHERE clause when a
 * database is introduced — fetch-then-compare is a race and easy to forget on
 * the next query someone adds. Use this where that is not possible.
 */
export async function requireOwnership(resourceOwnerId: string | null | undefined) {
  const principal = await getPrincipal();
  const outcome = authorizeOwnership(principal, resourceOwnerId);
  if (!outcome.ok) {
    return { ok: false as const, error: outcome.reason };
  }
  return { ok: true as const, principal: principal as Principal };
}
