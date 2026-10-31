import { fnv1a64, stableStringify } from "../hash";
import {
  minWarrantLevel,
  warrantRank,
  type WarrantLevel,
} from "../warrant-level";
import {
  normalizeTool,
  parsePersonaSpec,
  type PersonaSpec,
} from "./persona-schema";

/**
 * Content address of a persona spec. Any change to identity, voice, law,
 * ceiling, tools, or lineage changes the fingerprint, which in turn voids a
 * human approval that was bound to the old persona.
 */
export function personaFingerprint(spec: PersonaSpec): string {
  return `fnv1a64:${fnv1a64(stableStringify(["persona-v1", spec]))}`;
}

export function isToolWildcard(spec: PersonaSpec): boolean {
  return spec.allowedTools.length === 1 && spec.allowedTools[0] === "*";
}

/** Blocklist wins over allowlist; the wildcard admits any unblocked tool. */
export function toolPermitted(spec: PersonaSpec, tool: string): boolean {
  const key = normalizeTool(tool);
  if (spec.blockedTools.some((blocked) => normalizeTool(blocked) === key)) {
    return false;
  }
  if (isToolWildcard(spec)) return true;
  return spec.allowedTools.some((allowed) => normalizeTool(allowed) === key);
}

// ─── Attenuation (LYZT DASE: children never exceed parent authority) ─────────

export type AttenuationViolation =
  | { code: "parent_ref_mismatch"; detail: string }
  | { code: "risk_ceiling_exceeds_parent"; detail: string }
  | { code: "tool_not_in_parent"; detail: string }
  | { code: "parent_block_dropped"; detail: string }
  | { code: "parent_forbidden_dropped"; detail: string }
  | { code: "escalation_weakened"; detail: string };

/**
 * Checks that `child` holds no authority `parent` lacks. Returns every
 * violation rather than the first, so a reviewer sees the full widening.
 */
export function checkAttenuation(
  parent: PersonaSpec,
  child: PersonaSpec,
): AttenuationViolation[] {
  const violations: AttenuationViolation[] = [];

  if (child.parentRef !== parent.ref) {
    violations.push({
      code: "parent_ref_mismatch",
      detail: `${child.ref} names ${child.parentRef ?? "no parent"}, not ${parent.ref}.`,
    });
  }

  if (warrantRank(child.riskCeiling) > warrantRank(parent.riskCeiling)) {
    violations.push({
      code: "risk_ceiling_exceeds_parent",
      detail: `${child.riskCeiling} exceeds parent ceiling ${parent.riskCeiling}.`,
    });
  }

  if (!isToolWildcard(parent)) {
    const tools = isToolWildcard(child) ? ["*"] : child.allowedTools;
    for (const tool of tools) {
      if (tool === "*" || !toolPermitted(parent, tool)) {
        violations.push({ code: "tool_not_in_parent", detail: tool });
      }
    }
  }

  const childBlocked = new Set(child.blockedTools.map(normalizeTool));
  for (const tool of parent.blockedTools) {
    if (!childBlocked.has(normalizeTool(tool))) {
      violations.push({ code: "parent_block_dropped", detail: tool });
    }
  }

  const childForbidden = new Set(child.forbiddenActions);
  for (const action of parent.forbiddenActions) {
    if (!childForbidden.has(action)) {
      violations.push({ code: "parent_forbidden_dropped", detail: action });
    }
  }

  if (
    parent.escalateAtOrAbove !== null &&
    (child.escalateAtOrAbove === null ||
      warrantRank(child.escalateAtOrAbove) >
        warrantRank(parent.escalateAtOrAbove))
  ) {
    violations.push({
      code: "escalation_weakened",
      detail: `Parent escalates at ${parent.escalateAtOrAbove}; child at ${child.escalateAtOrAbove ?? "never"}.`,
    });
  }

  return violations;
}

/**
 * Verifies a lineage ordered root-first. Each persona must attenuate the one
 * before it, and the root must declare no parent.
 */
export function verifyLineage(chain: readonly PersonaSpec[]): {
  ok: boolean;
  violations: { ref: string; violation: AttenuationViolation }[];
} {
  const violations: { ref: string; violation: AttenuationViolation }[] = [];
  const root = chain[0];
  if (root && root.parentRef !== null) {
    violations.push({
      ref: root.ref,
      violation: {
        code: "parent_ref_mismatch",
        detail: `Root ${root.ref} must not name a parent.`,
      },
    });
  }
  for (let index = 1; index < chain.length; index += 1) {
    for (const violation of checkAttenuation(chain[index - 1], chain[index])) {
      violations.push({ ref: chain[index].ref, violation });
    }
  }
  return { ok: violations.length === 0, violations };
}

export type PersonaDraft = Omit<PersonaSpec, "parentRef" | "schemaVersion">;

/**
 * Builds a child persona that is attenuated by construction: the ceiling is
 * the lower of the two, tools are intersected, blocks and forbidden actions
 * are unioned, and escalation is the stricter of the two.
 */
export function derivePersona(
  parent: PersonaSpec,
  draft: PersonaDraft,
): { success: true; data: PersonaSpec } | { success: false; error: string } {
  const draftWildcard =
    draft.allowedTools.length === 1 && draft.allowedTools[0] === "*";
  // Intersect with the parent; a parent block removes the tool outright.
  const allowedTools = draftWildcard
    ? [...parent.allowedTools]
    : draft.allowedTools.filter((tool) => toolPermitted(parent, tool));

  const blockedKeys = new Set(draft.blockedTools.map(normalizeTool));
  const blockedTools = [
    ...draft.blockedTools,
    ...parent.blockedTools.filter(
      (tool) => !blockedKeys.has(normalizeTool(tool)),
    ),
  ];

  const escalateAtOrAbove =
    parent.escalateAtOrAbove === null
      ? draft.escalateAtOrAbove
      : draft.escalateAtOrAbove === null
        ? parent.escalateAtOrAbove
        : minWarrantLevel(parent.escalateAtOrAbove, draft.escalateAtOrAbove);

  const parsed = parsePersonaSpec({
    ...draft,
    schemaVersion: parent.schemaVersion,
    parentRef: parent.ref,
    riskCeiling: minWarrantLevel(parent.riskCeiling, draft.riskCeiling),
    allowedTools,
    blockedTools,
    forbiddenActions: [
      ...new Set([...parent.forbiddenActions, ...draft.forbiddenActions]),
    ],
    escalateAtOrAbove,
  });

  return parsed;
}

/**
 * Version monotonicity, from LYZT's signed agent contract: a revision must
 * keep the same ref and strictly increase the version, so an older, more
 * permissive persona cannot be replayed over a newer one.
 */
export function checkPersonaUpgrade(
  previous: PersonaSpec,
  next: PersonaSpec,
): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (previous.ref !== next.ref) {
    reasons.push(`ref changed from ${previous.ref} to ${next.ref}`);
  }
  if (next.version <= previous.version) {
    reasons.push(
      `version must increase (previous ${previous.version}, next ${next.version})`,
    );
  }
  return { ok: reasons.length === 0, reasons };
}

// ─── Kernel-facing authority evaluation ──────────────────────────────────────

export type PersonaBlockerCode =
  | "persona_invalid"
  | "persona_ceiling_exceeded"
  | "persona_tool_blocked"
  | "persona_escalation_required";

export type PersonaBlocker = {
  code: PersonaBlockerCode;
  message: string;
  hard: true;
};

/**
 * Evaluates whether a persona may hold the given lease at the given tier.
 * Every failure is hard: a persona boundary is an authority limit, not a
 * proof gap that more evidence could close.
 */
export function evaluatePersonaAuthority(
  persona: unknown,
  context: {
    warrantLevel: WarrantLevel;
    tools: readonly string[];
    approvalBound: boolean;
  },
): PersonaBlocker[] {
  const parsed = parsePersonaSpec(persona);
  if (!parsed.success) {
    return [
      {
        code: "persona_invalid",
        message: `Acting persona is invalid: ${parsed.error}`,
        hard: true,
      },
    ];
  }

  const spec = parsed.data;
  const blockers: PersonaBlocker[] = [];

  if (warrantRank(context.warrantLevel) > warrantRank(spec.riskCeiling)) {
    blockers.push({
      code: "persona_ceiling_exceeded",
      message: `${spec.displayName} may act up to ${spec.riskCeiling} risk; this warrant is ${context.warrantLevel}.`,
      hard: true,
    });
  }

  const denied = context.tools.filter((tool) => !toolPermitted(spec, tool));
  if (denied.length > 0) {
    blockers.push({
      code: "persona_tool_blocked",
      message: `${spec.displayName} may not hold: ${denied.join(", ")}.`,
      hard: true,
    });
  }

  if (
    spec.escalateAtOrAbove !== null &&
    warrantRank(context.warrantLevel) >= warrantRank(spec.escalateAtOrAbove) &&
    !context.approvalBound
  ) {
    blockers.push({
      code: "persona_escalation_required",
      message: `${spec.displayName} escalates to a human at ${spec.escalateAtOrAbove} risk. Record a bound approval.`,
      hard: true,
    });
  }

  return blockers;
}
