import Anthropic from "@anthropic-ai/sdk";
import type { ToolAdapter } from "../../executor/executor";
import type { CouncilVote } from "../../persona/council";
import { getExpert } from "../catalog";
import {
  compileExpertBrief,
  compileReviewBrief,
  reviewToCouncilVote,
  verifyExpertOutput,
  type ExpertBrief,
  type ExpertOutputCheck,
} from "../compile";
import type { ExpertSpec } from "../expert-schema";
import { routeTask, type TaskRoute } from "../router";

/**
 * Live Claude calls for the Expert Desk. Server-only: it reads credentials
 * from the environment through the SDK, so never import it from a client
 * component.
 *
 * Every call:
 * - uses the compiled brief (Claude Opus 5.5, routed effort, structured
 *   output constrained to the expert's deliverable schema);
 * - opts into server-side refusal fallback (`fallbacks: "default"`), so a
 *   classifier decline is retried on Anthropic's recommended model for that
 *   category instead of failing the task;
 * - checks `stop_reason` before reading content, and never trusts a reply
 *   that was refused or truncated.
 */

export const FALLBACK_BETA = "server-side-fallback-2026-07-01" as const;

export type BriefResult =
  | {
      ok: true;
      output: unknown;
      /** Model that actually answered; differs from the brief on fallback. */
      servedBy: string;
      inputTokens: number;
      outputTokens: number;
    }
  | {
      ok: false;
      reason: "refusal" | "max_tokens" | "no_text" | "invalid_json";
      detail: string;
      servedBy: string | null;
    };

export async function runBrief(
  client: Anthropic,
  brief: ExpertBrief,
  options: { signal?: AbortSignal } = {},
): Promise<BriefResult> {
  const response = await client.beta.messages.create(
    {
      model: brief.model,
      max_tokens: brief.maxTokens,
      betas: [FALLBACK_BETA],
      fallbacks: "default",
      system: brief.system,
      messages: [{ role: "user", content: brief.userMessage }],
      output_config: {
        effort: brief.effort,
        format: { type: "json_schema", schema: brief.outputSchema },
      },
    },
    { signal: options.signal },
  );

  if (response.stop_reason === "refusal") {
    return {
      ok: false,
      reason: "refusal",
      detail: response.stop_details?.explanation ?? "The request was declined.",
      servedBy: response.model,
    };
  }
  if (response.stop_reason === "max_tokens") {
    return {
      ok: false,
      reason: "max_tokens",
      detail: "The reply hit max_tokens and may be incomplete.",
      servedBy: response.model,
    };
  }

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");
  if (!text) {
    return {
      ok: false,
      reason: "no_text",
      detail: "The reply had no text content.",
      servedBy: response.model,
    };
  }

  try {
    return {
      ok: true,
      output: JSON.parse(text) as unknown,
      servedBy: response.model,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    };
  } catch {
    return {
      ok: false,
      reason: "invalid_json",
      detail: "The reply was not valid JSON.",
      servedBy: response.model,
    };
  }
}

export type Consultation = {
  route: TaskRoute;
  expert: ExpertSpec | null;
  brief: ExpertBrief | null;
  answer: BriefResult | null;
  check: ExpertOutputCheck | null;
  review: BriefResult | null;
  vote: CouncilVote | null;
  /** Usable only when the answer passed its contract and was not blocked. */
  accepted: boolean;
  summary: string;
};

/**
 * Full expert loop for one task: route, answer, verify the contract, then an
 * independent reviewer grades the answer. The reviewer's verdict comes back
 * as a council vote the Noesis kernel can enforce.
 */
export async function consultExpert(
  task: string,
  options: {
    client?: Anthropic;
    signal?: AbortSignal;
    expertRef?: string;
  } = {},
): Promise<Consultation> {
  const route = routeTask(task);
  const expert = options.expertRef
    ? (getExpert(options.expertRef) ?? null)
    : (route.primary?.expert ?? null);
  const empty = {
    route,
    expert,
    brief: null,
    answer: null,
    check: null,
    review: null,
    vote: null,
    accepted: false,
  };

  if (!expert) {
    return {
      ...empty,
      summary: route.clarifyingQuestion ?? "No expert matched this task.",
    };
  }

  const client = options.client ?? new Anthropic();
  const brief = compileExpertBrief(expert, task, route.effort);
  const answer = await runBrief(client, brief, { signal: options.signal });
  if (!answer.ok) {
    return {
      ...empty,
      brief,
      answer,
      summary: `${expert.title} did not return a usable answer: ${answer.detail}`,
    };
  }

  const check = verifyExpertOutput(expert, answer.output);
  const reviewer = getExpert(expert.reviewerRef);
  let review: BriefResult | null = null;
  let vote: CouncilVote | null = null;
  if (check.ok && reviewer) {
    review = await runBrief(
      client,
      compileReviewBrief(reviewer, expert, task, answer.output),
      { signal: options.signal },
    );
    vote = review.ok ? reviewToCouncilVote(reviewer, review.output) : null;
  }

  const accepted = check.ok && vote !== null && vote.verdict !== "block";
  const summary = !check.ok
    ? `${expert.title} broke its contract: ${check.problems.join("; ")}.`
    : !vote
      ? `${expert.title} answered, but the independent review did not complete.`
      : `${expert.title} answered; ${reviewer?.title} voted ${vote.verdict}: ${vote.reason}`;

  return {
    route,
    expert,
    brief,
    answer,
    check,
    review,
    vote,
    accepted,
    summary,
  };
}

/** Lease-tool name for consulting an expert through the warranted executor. */
export const CONSULT_EXPERT_TOOL = "consult expert";

/**
 * Exposes the expert loop as an executor adapter, so a consultation runs only
 * inside an ALLOW, under a lease, with a signed receipt. Verification passes
 * only when the contract holds and the reviewer did not block.
 */
export function createExpertAdapter(
  options: { client?: Anthropic } = {},
): ToolAdapter {
  return {
    tool: CONSULT_EXPERT_TOOL,
    describe: () =>
      "Routes a task to a Claude expert, verifies the deliverable, and runs an independent review.",
    async execute(input, { signal }) {
      const task =
        input && typeof input === "object" && "task" in input
          ? (input as { task: unknown }).task
          : undefined;
      if (typeof task !== "string" || task.trim().length < 3) {
        throw new Error('Expert consultation needs input { task: "..." }.');
      }
      const consultation = await consultExpert(task, {
        client: options.client,
        signal,
      });
      return { summary: consultation.summary, data: consultation };
    },
    async verify(_input, output) {
      const consultation = output.data as Consultation | undefined;
      return consultation?.accepted
        ? { ok: true, detail: `review ${consultation.vote?.verdict}` }
        : { ok: false, detail: consultation?.summary ?? "No consultation." };
    },
    // Consulting an expert produces advice only; nothing to undo.
    compensate: async () => undefined,
  };
}
