import { describe, expect, it } from "vitest";
import { verifyLineage } from "./persona";
import { parsePersonaSpec } from "./persona-schema";
import {
  CONSTITUTION_PERSONA,
  getLineage,
  PERSONA_REGISTRY,
  ROLE_PERSONAS,
  SPELLSHIMMER_ORACLE_PERSONA,
  TOOLS,
} from "./registry";
import { lintPersonaOutput } from "./stylometric";

describe("persona registry", () => {
  it("covers the constitution, all twelve roles, and the Oracle", () => {
    expect(ROLE_PERSONAS).toHaveLength(12);
    expect(PERSONA_REGISTRY).toHaveLength(14);
    expect(new Set(PERSONA_REGISTRY.map((p) => p.ref)).size).toBe(14);
  });

  it("every entry parses under the strict schema", () => {
    for (const persona of PERSONA_REGISTRY) {
      expect(parsePersonaSpec(persona).success, persona.ref).toBe(true);
    }
  });

  it("every lineage attenuates back to the constitution", () => {
    for (const persona of PERSONA_REGISTRY) {
      const lineage = getLineage(persona.ref);
      expect(lineage[0]?.ref, persona.ref).toBe(CONSTITUTION_PERSONA.ref);
      const result = verifyLineage(lineage);
      expect(result.violations, persona.ref).toEqual([]);
    }
  });

  it("no persona below the root can push, deploy production, or read env files", () => {
    for (const persona of PERSONA_REGISTRY) {
      for (const tool of [
        TOOLS.gitPush,
        TOOLS.deployProduction,
        TOOLS.readEnvFiles,
      ]) {
        expect(persona.blockedTools, `${persona.ref} ${tool}`).toContain(tool);
      }
    }
  });
});

describe("SpellShimmer Oracle voice", () => {
  const oracle = SPELLSHIMMER_ORACLE_PERSONA;

  it("accepts a reflective reading that acknowledges uncertainty", () => {
    const lint = lintPersonaOutput(
      oracle,
      "The Moon card is an invitation to rest. This is not a prediction; you may find a quieter path this week.",
    );
    expect(lint).toEqual({
      ok: true,
      bannedPhrases: [],
      claimTerms: [],
      missingRequiredMarker: false,
    });
  });

  it("flags fatalism, financial advice, overclaiming, and certainty", () => {
    const lint = lintPersonaOutput(
      oracle,
      "You are destined for wealth. Invest in gold now; success is guaranteed.",
    );
    expect(lint.ok).toBe(false);
    expect(lint.bannedPhrases).toEqual(["you are destined", "invest in"]);
    expect(lint.claimTerms).toEqual(["guaranteed"]);
    expect(lint.missingRequiredMarker).toBe(true);
  });

  it("forbids the full LYZT oracle policy list", () => {
    for (const action of [
      "diagnose-medical-condition",
      "give-legal-advice",
      "give-financial-advice",
      "predict-specific-outcome",
      "instill-dependency-on-oracle",
      "promote-fatalism",
    ]) {
      expect(oracle.forbiddenActions).toContain(action);
    }
    expect(oracle.riskCeiling).toBe("low");
  });
});
