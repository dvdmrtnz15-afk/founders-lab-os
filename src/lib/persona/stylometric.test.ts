import { describe, expect, it } from "vitest";
import {
  computeStylometric,
  findIndistinctPersonas,
  stylometricDistance,
  tokenJaccard,
} from "./stylometric";

const terse =
  "Finding: null check missing at src/lib/noesis.ts:42. Severity high. Fix before merge.";
const lyrical =
  "Beneath the silver moon, what are you ready to release? Let the tide carry it softly! What might bloom in the quiet?";

describe("stylometric signature", () => {
  it("is deterministic and empty-safe", () => {
    expect(computeStylometric(terse)).toEqual(computeStylometric(terse));
    expect(computeStylometric("").tokenSample).toEqual([]);
  });

  it("captures questions and exclamations", () => {
    const signature = computeStylometric(lyrical);
    expect(signature.questionRatio).toBeGreaterThan(0);
    expect(signature.exclamationRatio).toBeGreaterThan(0);
    expect(computeStylometric(terse).questionRatio).toBe(0);
  });

  it("measures identical text as distance 0 and different voices as far apart", () => {
    const a = computeStylometric(terse);
    expect(stylometricDistance(a, a)).toBe(0);
    expect(stylometricDistance(a, computeStylometric(lyrical))).toBeGreaterThan(
      0.5,
    );
  });

  it("tokenJaccard handles empty and disjoint sets", () => {
    expect(tokenJaccard([], [])).toBe(1);
    expect(tokenJaccard(["a"], ["b"])).toBe(0);
    expect(tokenJaccard(["a", "b"], ["b", "c"])).toBeCloseTo(1 / 3);
  });

  it("flags personas whose voices have collapsed together", () => {
    expect(
      findIndistinctPersonas({
        "role:reviewer": terse,
        "role:security": terse,
        "brand:spellshimmer-oracle": lyrical,
      }),
    ).toEqual([{ a: "role:reviewer", b: "role:security", distance: 0 }]);
  });
});
