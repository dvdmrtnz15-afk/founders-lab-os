import { getPersona } from "../persona/registry";
import { warrantRank, type WarrantLevel } from "../warrant-level";
import { EXPERT_CATALOG } from "./catalog";
import { EFFORT_ORDER, type Effort, type ExpertSpec } from "./expert-schema";

/**
 * Deterministic, explainable task router. No model call: every choice comes
 * with the exact signals that produced it, so a person can see why a task
 * went to an expert and override it.
 */

export type ExpertMatch = {
  expert: ExpertSpec;
  score: number;
  matched: string[];
};

export type TaskRoute = {
  primary: ExpertMatch | null;
  /** Other experts whose signals are strong enough to consult too. */
  alsoConsult: ExpertMatch[];
  reviewer: ExpertSpec | null;
  /** 0..1: how clearly the primary beat the runner-up. */
  confidence: number;
  effort: Effort;
  effortReasons: string[];
  suggestedWarrant: WarrantLevel;
  riskSignals: string[];
  /** The task needs more authority than the primary's persona holds. */
  exceedsPersonaCeiling: boolean;
  /** Set when routing is too weak or ambiguous to act on. */
  clarifyingQuestion: string | null;
};

const MIN_SCORE = 3;
const MIN_CONFIDENCE = 0.55;

const RISK_TERMS: readonly [string, WarrantLevel][] = [
  ["production", "high"],
  ["prod", "high"],
  ["payment", "high"],
  ["billing", "high"],
  ["customer data", "high"],
  ["data loss", "high"],
  ["delete", "high"],
  ["secrets", "high"],
  ["outage", "high"],
  ["incident", "high"],
  ["migration", "medium"],
  ["auth", "medium"],
  ["security", "medium"],
  ["deploy", "medium"],
  ["pii", "high"],
];

const SIMPLE_TERMS = ["quick", "simple", "typo", "small", "tiny", "one-line"];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const patternCache = new Map<string, RegExp>();
function containsTerm(text: string, term: string): boolean {
  let pattern = patternCache.get(term);
  if (!pattern) {
    pattern = new RegExp(`(^|[^a-z0-9])${escapeRegExp(term)}(?=$|[^a-z0-9])`);
    patternCache.set(term, pattern);
  }
  return pattern.test(text);
}

function shiftEffort(effort: Effort, by: number): Effort {
  const index = EFFORT_ORDER.indexOf(effort) + by;
  return EFFORT_ORDER[Math.max(0, Math.min(EFFORT_ORDER.length - 1, index))];
}

export function scoreExperts(
  task: string,
  catalog: readonly ExpertSpec[] = EXPERT_CATALOG,
): ExpertMatch[] {
  const text = task.toLowerCase();
  return catalog
    .map((expert) => {
      const matched = expert.signals.filter((s) => containsTerm(text, s.term));
      return {
        expert,
        score: matched.reduce((sum, s) => sum + s.weight, 0),
        matched: matched.map((s) => s.term),
      };
    })
    .filter((match) => match.score > 0)
    .sort(
      (a, b) => b.score - a.score || (a.expert.ref < b.expert.ref ? -1 : 1),
    );
}

export function routeTask(
  task: string,
  catalog: readonly ExpertSpec[] = EXPERT_CATALOG,
): TaskRoute {
  const text = task.toLowerCase();
  const ranked = scoreExperts(task, catalog);
  const [top, second] = ranked;

  const riskHits = RISK_TERMS.filter(([term]) => containsTerm(text, term));
  const riskSignals = riskHits.map(([term]) => term);
  const suggestedWarrant: WarrantLevel = riskHits.some(([, l]) => l === "high")
    ? "high"
    : riskHits.length > 0
      ? "medium"
      : "low";

  const confidence = !top
    ? 0
    : !second
      ? 1
      : Number((top.score / (top.score + second.score)).toFixed(2));

  const primary = top && top.score >= MIN_SCORE ? top : null;
  const clarifyingQuestion = !primary
    ? "What outcome do you need: a fix, a review, a design, a plan, or a document?"
    : confidence < MIN_CONFIDENCE && second
      ? `Is this mainly ${primary.expert.title.toLowerCase()} work or ${second.expert.title.toLowerCase()} work?`
      : null;

  let effort: Effort = primary?.expert.effort ?? "medium";
  const effortReasons: string[] = [];
  if (primary) effortReasons.push(`${primary.expert.title} default: ${effort}`);
  if (riskSignals.length > 0) {
    effort = shiftEffort(effort, 1);
    effortReasons.push(`raised for risk: ${riskSignals.join(", ")}`);
  }
  if (task.length > 600) {
    effort = shiftEffort(effort, 1);
    effortReasons.push("raised for a long, detailed task");
  }
  const simple = SIMPLE_TERMS.filter((t) => containsTerm(text, t));
  if (simple.length > 0 && riskSignals.length === 0) {
    effort = shiftEffort(effort, -1);
    effortReasons.push(`lowered for a small task: ${simple.join(", ")}`);
  }

  const persona = primary ? getPersona(primary.expert.personaRef) : undefined;
  const exceedsPersonaCeiling = Boolean(
    persona && warrantRank(suggestedWarrant) > warrantRank(persona.riskCeiling),
  );

  const alsoConsult = primary
    ? ranked
        .slice(1)
        .filter((m) => m.score >= Math.max(MIN_SCORE, primary.score * 0.5))
        .slice(0, 2)
    : [];

  const reviewer = primary
    ? (catalog.find((e) => e.ref === primary.expert.reviewerRef) ?? null)
    : null;

  return {
    primary,
    alsoConsult,
    reviewer,
    confidence,
    effort,
    effortReasons,
    suggestedWarrant,
    riskSignals,
    exceedsPersonaCeiling,
    clarifyingQuestion,
  };
}
