import { z } from "zod";
import { personaRefSchema } from "./persona-schema";

/**
 * Persona council, adapted from LYZT `shared/schema/council-verdict.ts`.
 *
 * One deliberate change: in LYZT a council can *pass* work. Here a council can
 * only object. Consensus is not proof (`self_confidence_counts_as_proof:
 * false` in the public contract), so unanimous approval yields
 * `no_objection`, never `allowed`, and adds no evidence coverage. A council
 * vote can block or hold; only verified evidence and policy can allow.
 */
export const councilVoteSchema = z.strictObject({
  personaRef: personaRefSchema,
  verdict: z.enum(["pass", "warn", "block"]),
  score: z.number().min(0).max(1),
  reason: z.string().trim().min(3).max(240),
  /** A blocking vote from a hard-veto reviewer stops the warrant outright. */
  hardVeto: z.boolean(),
});

export const councilSchema = z.array(councilVoteSchema).max(12);

export type CouncilVote = z.infer<typeof councilVoteSchema>;

export type CouncilOutcome = "no_objection" | "hold" | "veto" | "invalid";

export type CouncilAggregate = {
  outcome: CouncilOutcome;
  size: number;
  meanScore: number;
  vetoedBy: string[];
  heldBy: string[];
  /** Reasons the council itself cannot be counted. */
  problems: string[];
};

/**
 * Aggregates council votes. A council is invalid when a persona votes twice
 * (clone multiplication, as cogmesh guards against) or when the acting
 * persona reviews its own proposal.
 */
export function aggregateCouncil(
  votes: unknown,
  actingPersonaRef: string | null = null,
): CouncilAggregate {
  const parsed = councilSchema.safeParse(votes);
  if (!parsed.success) {
    return {
      outcome: "invalid",
      size: 0,
      meanScore: 0,
      vetoedBy: [],
      heldBy: [],
      problems: parsed.error.issues
        .slice(0, 3)
        .map(
          (issue) => `${issue.path.join(".") || "council"}: ${issue.message}`,
        ),
    };
  }

  const list = parsed.data;
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const vote of list) {
    if (seen.has(vote.personaRef)) {
      problems.push(`${vote.personaRef} voted more than once.`);
    }
    seen.add(vote.personaRef);
    if (actingPersonaRef && vote.personaRef === actingPersonaRef) {
      problems.push(`${vote.personaRef} cannot review its own proposal.`);
    }
  }

  const vetoedBy = list
    .filter((vote) => vote.verdict === "block" && vote.hardVeto)
    .map((vote) => vote.personaRef);
  const heldBy = list
    .filter(
      (vote) =>
        vote.verdict === "warn" || (vote.verdict === "block" && !vote.hardVeto),
    )
    .map((vote) => vote.personaRef);
  const meanScore =
    list.length === 0
      ? 0
      : list.reduce((total, vote) => total + vote.score, 0) / list.length;

  const outcome: CouncilOutcome =
    problems.length > 0
      ? "invalid"
      : vetoedBy.length > 0
        ? "veto"
        : heldBy.length > 0
          ? "hold"
          : "no_objection";

  return {
    outcome,
    size: list.length,
    meanScore,
    vetoedBy,
    heldBy,
    problems: [...new Set(problems)],
  };
}
