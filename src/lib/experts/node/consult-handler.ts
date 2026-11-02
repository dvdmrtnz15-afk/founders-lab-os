import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { expertAccess } from "../../auth/access";
import type { Principal } from "../../auth/authorization";
import type { SpendGuard } from "../spend-guard";
import type { Consultation } from "./claude-expert";

/**
 * Request handling for `POST /api/experts/consult`, kept free of Next.js so
 * every gate is unit-testable. Gates run in order and the first failure
 * answers; nothing reaches Claude until all of them pass:
 *
 *   same-origin → JSON → configured → signed in → allowlisted → valid input
 *   → spend limit → consult
 */

export const consultRequestSchema = z.strictObject({
  task: z.string().trim().min(3).max(4000),
});

export type ConsultDeps = {
  authConfigured: boolean;
  getPrincipal: () => Promise<Principal | null>;
  allowlist: ReadonlySet<string>;
  guard: SpendGuard;
  consult: (task: string, signal: AbortSignal) => Promise<Consultation>;
  log?: (event: string, fields: Record<string, unknown>) => void;
};

function json(status: number, body: unknown, headers: HeadersInit = {}) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store", ...headers },
  });
}

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  // Browsers send Origin on cross-origin POSTs. A missing header means a
  // same-origin or non-browser client; the session cookie still gates it.
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

/** The response shape: what the user needs, nothing internal. */
export function presentConsultation(c: Consultation) {
  return {
    accepted: c.accepted,
    summary: c.summary,
    expert: c.expert ? { ref: c.expert.ref, title: c.expert.title } : null,
    effort: c.route.effort,
    suggestedWarrant: c.route.suggestedWarrant,
    exceedsPersonaCeiling: c.route.exceedsPersonaCeiling,
    clarifyingQuestion: c.expert ? null : c.route.clarifyingQuestion,
    answer: c.answer?.ok ? c.answer.output : null,
    servedBy: c.answer?.servedBy ?? null,
    contractProblems: c.check?.problems ?? [],
    review: c.vote
      ? { verdict: c.vote.verdict, reason: c.vote.reason, score: c.vote.score }
      : null,
  };
}

export async function handleConsult(
  request: Request,
  deps: ConsultDeps,
): Promise<Response> {
  const log = deps.log ?? (() => undefined);

  if (!sameOrigin(request)) {
    return json(403, { error: "Cross-origin requests are not accepted." });
  }
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return json(415, { error: "Send the task as JSON." });
  }

  const principal = await deps.getPrincipal();
  const access = expertAccess(deps.authConfigured, principal, deps.allowlist);
  if (access === "unconfigured") {
    return json(503, {
      error: "Sign-in is not configured on this deployment.",
    });
  }
  if (access === "anonymous") {
    return json(401, { error: "Sign in to ask an expert." });
  }
  if (access === "not_allowed") {
    return json(403, {
      error: "Your account is not on this deployment's expert allowlist.",
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(400, { error: "The request body is not valid JSON." });
  }
  const parsed = consultRequestSchema.safeParse(body);
  if (!parsed.success) {
    return json(400, { error: "Describe the task in 3 to 4,000 characters." });
  }

  const userId = principal!.id;
  const spend = deps.guard.tryConsume(userId);
  if (!spend.ok) {
    log("expert.consult.limited", { userId, reason: spend.reason });
    return json(
      429,
      {
        error:
          spend.reason === "user_hourly_limit"
            ? "Hourly limit reached. Try again later."
            : "This deployment's daily limit is reached.",
      },
      { "Retry-After": String(spend.retryAfterSeconds) },
    );
  }

  try {
    const consultation = await deps.consult(parsed.data.task, request.signal);
    log("expert.consult.done", {
      userId,
      expert: consultation.expert?.ref ?? null,
      accepted: consultation.accepted,
      servedBy: consultation.answer?.servedBy ?? null,
    });
    return json(200, presentConsultation(consultation));
  } catch (error) {
    // Upstream details stay in the server log, never in the response.
    if (error instanceof Anthropic.AuthenticationError) {
      log("expert.consult.error", {
        userId,
        kind: "auth",
        status: error.status,
      });
      return json(503, { error: "Claude is not configured on this server." });
    }
    if (
      error instanceof Anthropic.RateLimitError ||
      error instanceof Anthropic.InternalServerError
    ) {
      log("expert.consult.error", {
        userId,
        kind: "busy",
        status: error.status,
      });
      return json(503, {
        error: "Claude is busy right now. Try again shortly.",
      });
    }
    if (error instanceof Anthropic.APIUserAbortError) {
      return json(499, { error: "Request cancelled." });
    }
    if (error instanceof Anthropic.APIError) {
      log("expert.consult.error", {
        userId,
        kind: "api",
        status: error.status,
      });
      return json(502, { error: "The expert could not answer. Try again." });
    }
    log("expert.consult.error", {
      userId,
      kind: "unexpected",
      name: error instanceof Error ? error.name : "unknown",
    });
    return json(500, { error: "Something went wrong. Try again." });
  }
}
