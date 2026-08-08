import { NextResponse } from "next/server";

/**
 * Route-level auth gate — DORMANT BY DESIGN.
 *
 * The auth foundation is complete and tested, but no route is protected yet.
 * `/noesis` is public today, and making it private is a user-visible behavior
 * change that needs the operator's explicit approval; `AGENTS.md` puts auth in
 * the CLOUD escalation tier, and the project's product standard explicitly lists
 * "hidden value behind login" as something to avoid.
 *
 * To activate, replace the matcher below with the routes to protect, e.g.
 *
 *   matcher: ["/noesis/:path*"]
 *
 * Note what this layer is for: redirecting anonymous traffic so it sees a
 * sign-in page instead of an empty shell. It is UX, not security. Anything that
 * reaches a route handler directly bypasses it, which is why every protected
 * surface calls `requireSession()` server-side regardless.
 */
export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: ["/__auth-disabled/:path*"],
};
