import { readAllowlist } from "@/lib/auth/access";
import { isAuthConfigured } from "@/lib/auth/env";
import { getPrincipal } from "@/lib/auth/session";
import { consultExpert } from "@/lib/experts/node/claude-expert";
import { handleConsult } from "@/lib/experts/node/consult-handler";
import { createSpendGuard, readSpendPolicy } from "@/lib/experts/spend-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// An expert answer plus an independent review at high effort can take
// minutes. Hosts cap this at their own plan limit.
export const maxDuration = 300;

// One guard per server instance; see spend-guard.ts for the scope note.
const guard = createSpendGuard(readSpendPolicy());

export function POST(request: Request) {
  return handleConsult(request, {
    authConfigured: isAuthConfigured(),
    getPrincipal,
    allowlist: readAllowlist(),
    guard,
    consult: (task, signal) => consultExpert(task, { signal }),
    log: (event, fields) =>
      console.info(
        JSON.stringify({ event, ...fields, at: new Date().toISOString() }),
      ),
  });
}
