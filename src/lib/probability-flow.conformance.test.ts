import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  PROBABILITY_FLOW_CANONICALIZATION_VERSION,
  PROBABILITY_FLOW_PROOF_BUNDLE_VERSION,
  canonicalizeProbabilityFlowInput,
  resolveProbabilityFlow,
} from "./probability-flow";
import { probabilityFlowProtocolSchema } from "./probability-flow-schema";

type BlockedEffect = { effectId: string; blockerCodes: string[] };

type ConformanceVector = {
  id: string;
  description: string;
  derivation: string;
  input: unknown;
  expect:
    | { valid: false; rule: string }
    | {
        valid: true;
        canonicalInputSha256: string;
        decision: string;
        authorizedEffectIds: string[];
        blockedEffects: BlockedEffect[];
      };
};

type ConformanceFile = {
  format: string;
  formatVersion: number;
  protocolVersion: string;
  canonicalization: string;
  evaluatedAt: string;
  vectors: ConformanceVector[];
};

// The vector file is the portable specification. Other runtimes (Lyzt) load
// the same file; this test proves the reference implementation satisfies it.
const conformance = JSON.parse(
  readFileSync(
    new URL("../../public/ipf-conformance-v0.1.0.json", import.meta.url),
    "utf8",
  ),
) as ConformanceFile;

const sortedBlocked = (effects: readonly BlockedEffect[]) =>
  effects
    .map((effect) => ({
      effectId: effect.effectId,
      blockerCodes: [...effect.blockerCodes].sort(),
    }))
    .sort((a, b) => (a.effectId < b.effectId ? -1 : 1));

describe("probability-flow conformance vectors", () => {
  it("targets the protocol version this reference implements", () => {
    expect(conformance.format).toBe("ipf-conformance");
    expect(conformance.formatVersion).toBe(1);
    expect(conformance.protocolVersion).toBe(
      PROBABILITY_FLOW_PROOF_BUNDLE_VERSION,
    );
    expect(conformance.canonicalization).toBe(
      PROBABILITY_FLOW_CANONICALIZATION_VERSION,
    );
    expect(new Set(conformance.vectors.map((v) => v.id)).size).toBe(
      conformance.vectors.length,
    );
    expect(conformance.vectors.some((v) => v.expect.valid)).toBe(true);
    expect(conformance.vectors.some((v) => !v.expect.valid)).toBe(true);
  });

  for (const vector of conformance.vectors) {
    it(`${vector.id}: ${vector.description}`, () => {
      const parsed = probabilityFlowProtocolSchema.safeParse(vector.input);

      if (!vector.expect.valid) {
        expect(parsed.success).toBe(false);
        return;
      }

      expect(parsed.success).toBe(true);
      if (!parsed.success) return;

      const canonical = canonicalizeProbabilityFlowInput(parsed.data);
      expect(createHash("sha256").update(canonical).digest("hex")).toBe(
        vector.expect.canonicalInputSha256,
      );

      const receipt = resolveProbabilityFlow(
        parsed.data,
        conformance.evaluatedAt,
      );
      expect(receipt.decision).toBe(vector.expect.decision);
      expect([...receipt.authorizedEffectIds].sort()).toEqual(
        vector.expect.authorizedEffectIds,
      );
      expect(sortedBlocked(receipt.blockedEffects)).toEqual(
        sortedBlocked(vector.expect.blockedEffects),
      );
    });
  }
});
