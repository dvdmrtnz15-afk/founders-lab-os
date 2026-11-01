import type { CouncilVote } from "../persona/council";
import type { PersonaSpec } from "../persona/persona-schema";
import { getPersona } from "../persona/registry";
import { lintPersonaOutput } from "../persona/stylometric";
import type { Effort, ExpertSpec } from "./expert-schema";

/**
 * Compiles an expert into a provider-ready request brief. Pure: it builds the
 * request, it never sends it. A host adapter sends it with the official
 * Anthropic SDK and feeds the reply back through `verifyExpertOutput`.
 *
 * Model policy: every expert runs on Claude Opus 5.5. What changes per task is
 * the brief, the deliverable contract, and effort; the model is never
 * silently downgraded to save cost.
 */
export const EXPERT_MODEL = "claude-opus-5-5" as const;

export type JsonSchema = {
  type: "object";
  properties: Record<string, unknown>;
  required: string[];
  additionalProperties: false;
};

export type ExpertBrief = {
  expertRef: string;
  personaRef: string;
  model: typeof EXPERT_MODEL;
  effort: Effort;
  maxTokens: number;
  system: string;
  userMessage: string;
  outputSchema: JsonSchema;
};

function humanize(actionId: string): string {
  return actionId.replace(/-/g, " ");
}

function personaFor(expert: ExpertSpec): PersonaSpec {
  const persona = getPersona(expert.personaRef);
  if (!persona) throw new Error(`Unknown persona ${expert.personaRef}`);
  return persona;
}

export function deliverableSchema(expert: ExpertSpec): JsonSchema {
  const properties: Record<string, unknown> = {};
  for (const section of expert.deliverable) {
    properties[section.id] = { type: "string", description: section.guidance };
  }
  properties.assumptions = {
    type: "array",
    items: { type: "string" },
    description: "Anything you had to assume because the task did not say.",
  };
  return {
    type: "object",
    properties,
    required: [...expert.deliverable.map((s) => s.id), "assumptions"],
    additionalProperties: false,
  };
}

/**
 * The system prompt is deliberately short and declarative: current Claude
 * models do better with a clear role, goal, and boundaries than with
 * step-by-step scripts.
 */
export function compileExpertBrief(
  expert: ExpertSpec,
  task: string,
  effort: Effort = expert.effort,
): ExpertBrief {
  const persona = personaFor(expert);
  const system = [
    `You are the ${expert.title}. ${expert.promise}`,
    "",
    "How you work:",
    ...expert.method.map((m) => `- ${m}`),
    "",
    "Boundaries:",
    `- ${persona.governingLaw}`,
    `- Never: ${persona.forbiddenActions.map(humanize).join("; ")}.`,
    ...persona.voice.do.map((d) => `- Do: ${d}.`),
    ...persona.voice.avoid.map((a) => `- Avoid: ${a}.`),
    "",
    "Deliverable: return only the structured fields below.",
    ...expert.deliverable.map((s) => `- ${s.id} (${s.label}): ${s.guidance}`),
    "- assumptions: list anything the task did not tell you instead of guessing silently.",
    "",
    "A separate reviewer will grade your work on:",
    ...expert.rubric.map((r) => `- ${r}`),
  ].join("\n");

  return {
    expertRef: expert.ref,
    personaRef: persona.ref,
    model: EXPERT_MODEL,
    effort,
    maxTokens: 16_000,
    system,
    userMessage: task.trim(),
    outputSchema: deliverableSchema(expert),
  };
}

export type ExpertOutputCheck = {
  ok: boolean;
  problems: string[];
};

/**
 * Checks a structured reply against the expert's deliverable contract and the
 * persona's machine-checkable voice rules. It never trusts the model's own
 * claim of completeness.
 */
export function verifyExpertOutput(
  expert: ExpertSpec,
  output: unknown,
): ExpertOutputCheck {
  const problems: string[] = [];
  if (!output || typeof output !== "object" || Array.isArray(output)) {
    return { ok: false, problems: ["reply is not a structured object"] };
  }
  const record = output as Record<string, unknown>;

  for (const section of expert.deliverable) {
    const value = record[section.id];
    if (typeof value !== "string" || value.trim().length === 0) {
      problems.push(`missing ${section.label.toLowerCase()} (${section.id})`);
    }
  }
  if (!Array.isArray(record.assumptions)) {
    problems.push("missing assumptions list");
  }
  const allowed = new Set([
    ...expert.deliverable.map((s) => s.id),
    "assumptions",
  ]);
  for (const key of Object.keys(record)) {
    if (!allowed.has(key)) problems.push(`unexpected field ${key}`);
  }

  const text = expert.deliverable
    .map((s) => record[s.id])
    .filter((v): v is string => typeof v === "string")
    .join("\n");
  const lint = lintPersonaOutput(personaFor(expert), text);
  problems.push(...lint.bannedPhrases.map((p) => `banned phrase: ${p}`));
  problems.push(...lint.claimTerms.map((t) => `overclaim: ${t}`));
  if (lint.missingRequiredMarker)
    problems.push("missing required voice marker");

  return { ok: problems.length === 0, problems };
}

// ─── Independent review → council vote ───────────────────────────────────────

export function reviewSchema(expert: ExpertSpec): JsonSchema {
  return {
    type: "object",
    properties: {
      verdict: { type: "string", enum: ["pass", "warn", "block"] },
      reason: { type: "string" },
      checks: {
        type: "array",
        items: {
          type: "object",
          properties: {
            check: { type: "string", enum: [...expert.rubric] },
            passed: { type: "boolean" },
            note: { type: "string" },
          },
          required: ["check", "passed", "note"],
          additionalProperties: false,
        },
      },
    },
    required: ["verdict", "reason", "checks"],
    additionalProperties: false,
  };
}

export function compileReviewBrief(
  reviewer: ExpertSpec,
  author: ExpertSpec,
  task: string,
  authorOutput: unknown,
): ExpertBrief {
  const base = compileExpertBrief(reviewer, task, reviewer.effort);
  return {
    ...base,
    system: [
      `You are the ${reviewer.title}, independently reviewing work by the ${author.title}.`,
      "Grade the work only against the rubric below. Do not rewrite it.",
      "Block when a check fails in a way that would mislead or harm the user; warn when it is incomplete.",
      "",
      "Rubric:",
      ...author.rubric.map((r) => `- ${r}`),
    ].join("\n"),
    userMessage: [
      "Task:",
      task.trim(),
      "",
      "Work to review (JSON):",
      JSON.stringify(authorOutput, null, 2),
    ].join("\n"),
    outputSchema: reviewSchema(author),
  };
}

/**
 * Converts a reviewer's structured verdict into a council vote the Noesis
 * kernel already understands. A block from the security auditor is a hard
 * veto; any other block holds the warrant.
 */
export function reviewToCouncilVote(
  reviewer: ExpertSpec,
  review: unknown,
): CouncilVote | null {
  if (!review || typeof review !== "object") return null;
  const r = review as {
    verdict?: unknown;
    reason?: unknown;
    checks?: unknown;
  };
  if (r.verdict !== "pass" && r.verdict !== "warn" && r.verdict !== "block") {
    return null;
  }
  const checks = Array.isArray(r.checks) ? r.checks : [];
  const passed = checks.filter(
    (c) =>
      c && typeof c === "object" && (c as { passed?: unknown }).passed === true,
  ).length;
  const reason =
    typeof r.reason === "string" && r.reason.trim().length >= 3
      ? r.reason.trim().slice(0, 240)
      : `${reviewer.title} returned ${r.verdict}.`;

  return {
    personaRef: reviewer.personaRef,
    verdict: r.verdict,
    score:
      checks.length === 0 ? 0 : Number((passed / checks.length).toFixed(2)),
    reason,
    hardVeto:
      r.verdict === "block" && reviewer.ref === "expert:security-auditor",
  };
}
