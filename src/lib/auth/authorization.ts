/**
 * Pure authorization predicates.
 *
 * Kept free of Next.js and next-auth imports so they are cheap to test and
 * impossible to accidentally couple to a request context. A session proves who
 * someone is; nothing in it says a given row belongs to them. That second
 * question is what lives here.
 */

export type Principal = {
  id: string;
  email: string | null;
  name: string | null;
};

export type AuthorizationOutcome =
  | { ok: true }
  | { ok: false; reason: "UNAUTHENTICATED" | "NOT_FOUND" };

/**
 * Decide whether `principal` may act on a resource owned by `resourceOwnerId`.
 *
 * Denials for a resource the caller does not own return NOT_FOUND rather than
 * FORBIDDEN on purpose: FORBIDDEN confirms the resource exists, which turns the
 * endpoint into an enumeration oracle. The caller learns nothing either way.
 */
export function authorizeOwnership(
  principal: Principal | null,
  resourceOwnerId: string | null | undefined,
): AuthorizationOutcome {
  if (!principal?.id) {
    return { ok: false, reason: "UNAUTHENTICATED" };
  }
  if (!resourceOwnerId || resourceOwnerId !== principal.id) {
    return { ok: false, reason: "NOT_FOUND" };
  }
  return { ok: true };
}

/**
 * Narrow an unknown session payload to a Principal.
 *
 * A session without a stable `id` is unusable for ownership checks, so it is
 * treated as no session at all rather than as a partially-trusted one.
 */
export function toPrincipal(user: unknown): Principal | null {
  if (typeof user !== "object" || user === null) return null;
  const candidate = user as Record<string, unknown>;
  const id = candidate.id;
  if (typeof id !== "string" || id.length === 0) return null;
  return {
    id,
    email: typeof candidate.email === "string" ? candidate.email : null,
    name: typeof candidate.name === "string" ? candidate.name : null,
  };
}
