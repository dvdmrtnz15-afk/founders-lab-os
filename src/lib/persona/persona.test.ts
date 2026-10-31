import { describe, expect, it } from "vitest";
import { bannedClaimTerm, findClaimTerms } from "./claim-guard";
import {
  checkAttenuation,
  checkPersonaUpgrade,
  derivePersona,
  evaluatePersonaAuthority,
  type PersonaDraft,
  personaFingerprint,
  toolPermitted,
  verifyLineage,
} from "./persona";
import { parsePersonaSpec, type PersonaSpec } from "./persona-schema";
import { CONSTITUTION_PERSONA, getPersona, TOOLS } from "./registry";

const reviewer = getPersona("role:reviewer")!;
const data = getPersona("role:data")!;

function child(overrides: Partial<PersonaSpec> = {}): PersonaSpec {
  return { ...reviewer, ref: "role:junior-reviewer", ...overrides };
}

describe("claim guard", () => {
  it("matches whole words only, fixing the LYZT substring bug", () => {
    expect(bannedClaimTerm("Managing agent")).toBeNull();
    expect(bannedClaimTerm("Agile coach")).toBeNull();
    expect(bannedClaimTerm("Unconsciously helpful")).toBeNull();
    expect(bannedClaimTerm("Our AGI helper")).toBe("agi");
    expect(bannedClaimTerm("A sentient guide")).toBe("sentient");
  });

  it("finds multi-word and punctuated claims", () => {
    expect(findClaimTerms("100% accurate and never wrong")).toEqual([
      "100% accurate",
      "never wrong",
    ]);
    expect(findClaimTerms("results are guaranteed.")).toEqual(["guaranteed"]);
  });
});

describe("persona schema", () => {
  it("rejects overclaiming names, missions, and laws", () => {
    const result = parsePersonaSpec({
      ...reviewer,
      displayName: "Sentient Reviewer",
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("displayName");
  });

  it("rejects a tool that is both allowed and blocked", () => {
    const result = parsePersonaSpec({
      ...reviewer,
      allowedTools: [TOOLS.readWorkspace, "Git  Push"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a wildcard mixed with named tools and a self-parent", () => {
    expect(
      parsePersonaSpec({ ...reviewer, allowedTools: ["*", TOOLS.runChecks] })
        .success,
    ).toBe(false);
    expect(
      parsePersonaSpec({ ...reviewer, parentRef: reviewer.ref }).success,
    ).toBe(false);
  });

  it("rejects unknown fields", () => {
    expect(parsePersonaSpec({ ...reviewer, sentience: 1 }).success).toBe(false);
  });
});

describe("personaFingerprint", () => {
  it("is stable under key order and changes with any content edit", () => {
    const reordered = Object.fromEntries(
      Object.entries(reviewer).reverse(),
    ) as PersonaSpec;
    expect(personaFingerprint(reordered)).toBe(personaFingerprint(reviewer));
    expect(
      personaFingerprint({
        ...reviewer,
        governingLaw: `${reviewer.governingLaw} `,
      }),
    ).not.toBe(personaFingerprint(reviewer));
  });
});

describe("toolPermitted", () => {
  it("lets the blocklist win over the wildcard and normalizes spacing", () => {
    expect(toolPermitted(CONSTITUTION_PERSONA, "anything")).toBe(true);
    expect(toolPermitted(CONSTITUTION_PERSONA, "  GIT   push ")).toBe(false);
    expect(toolPermitted(reviewer, "Read Workspace")).toBe(true);
    expect(toolPermitted(reviewer, TOOLS.editFiles)).toBe(false);
  });
});

describe("attenuation", () => {
  it("accepts a strictly narrower child", () => {
    const narrow = child({
      parentRef: reviewer.ref,
      allowedTools: [TOOLS.readWorkspace],
    });
    expect(checkAttenuation(reviewer, narrow)).toEqual([]);
  });

  it("reports every widening, not only the first", () => {
    const wide = child({
      parentRef: reviewer.ref,
      riskCeiling: "high",
      allowedTools: [TOOLS.readWorkspace, TOOLS.editFiles],
      blockedTools: [],
      forbiddenActions: [],
      escalateAtOrAbove: null,
    });
    const codes = checkAttenuation(reviewer, wide).map((v) => v.code);
    expect(codes).toEqual(
      expect.arrayContaining([
        "risk_ceiling_exceeds_parent",
        "tool_not_in_parent",
        "parent_block_dropped",
        "parent_forbidden_dropped",
        "escalation_weakened",
      ]),
    );
  });

  it("rejects a wildcard child of a named-tool parent", () => {
    const wild = child({ parentRef: reviewer.ref, allowedTools: ["*"] });
    expect(checkAttenuation(reviewer, wild).map((v) => v.code)).toContain(
      "tool_not_in_parent",
    );
  });

  it("derivePersona narrows a too-broad draft by construction", () => {
    const draft: Partial<PersonaSpec> = child({
      riskCeiling: "critical",
      allowedTools: [TOOLS.readWorkspace, TOOLS.editFiles, TOOLS.gitPush],
      blockedTools: [],
      forbiddenActions: ["extra-rule"],
      escalateAtOrAbove: null,
    });
    delete draft.parentRef;
    delete draft.schemaVersion;
    const derived = derivePersona(reviewer, draft as PersonaDraft);

    expect(derived.success).toBe(true);
    if (!derived.success) return;
    expect(derived.data.riskCeiling).toBe("low");
    expect(derived.data.allowedTools).toEqual([TOOLS.readWorkspace]);
    expect(derived.data.forbiddenActions).toContain("extra-rule");
    expect(derived.data.escalateAtOrAbove).toBe(reviewer.escalateAtOrAbove);
    expect(checkAttenuation(reviewer, derived.data)).toEqual([]);
  });

  it("verifyLineage requires a parentless root", () => {
    expect(verifyLineage([CONSTITUTION_PERSONA, reviewer]).ok).toBe(true);
    expect(verifyLineage([reviewer]).ok).toBe(false);
  });
});

describe("checkPersonaUpgrade", () => {
  it("requires the same ref and a strictly higher version", () => {
    expect(checkPersonaUpgrade(reviewer, { ...reviewer, version: 2 }).ok).toBe(
      true,
    );
    expect(checkPersonaUpgrade(reviewer, reviewer).ok).toBe(false);
    expect(
      checkPersonaUpgrade(reviewer, { ...data, version: 9 }).reasons[0],
    ).toContain("ref changed");
  });
});

describe("evaluatePersonaAuthority", () => {
  const base = { approvalBound: false };

  it("passes a persona inside its ceiling and tools", () => {
    expect(
      evaluatePersonaAuthority(reviewer, {
        ...base,
        warrantLevel: "low",
        tools: [TOOLS.readWorkspace, TOOLS.runChecks],
      }),
    ).toEqual([]);
  });

  it("hard-blocks a ceiling breach, a denied tool, and missing escalation", () => {
    const codes = evaluatePersonaAuthority(reviewer, {
      ...base,
      warrantLevel: "high",
      tools: [TOOLS.readWorkspace, TOOLS.editFiles],
    }).map((b) => b.code);
    expect(codes).toEqual([
      "persona_ceiling_exceeded",
      "persona_tool_blocked",
      "persona_escalation_required",
    ]);
  });

  it("clears escalation only with a bound approval", () => {
    const tools = [TOOLS.readWorkspace];
    expect(
      evaluatePersonaAuthority(data, {
        warrantLevel: "medium",
        tools,
        approvalBound: false,
      }).map((b) => b.code),
    ).toEqual(["persona_escalation_required"]);
    expect(
      evaluatePersonaAuthority(data, {
        warrantLevel: "medium",
        tools,
        approvalBound: true,
      }),
    ).toEqual([]);
  });

  it("fails closed on an invalid persona", () => {
    const blockers = evaluatePersonaAuthority(
      { ref: "nope" },
      { ...base, warrantLevel: "low", tools: [] },
    );
    expect(blockers.map((b) => b.code)).toEqual(["persona_invalid"]);
    expect(blockers[0].hard).toBe(true);
  });
});
