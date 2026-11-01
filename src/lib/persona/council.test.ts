import { describe, expect, it } from "vitest";
import { aggregateCouncil, type CouncilVote } from "./council";

function vote(overrides: Partial<CouncilVote> = {}): CouncilVote {
  return {
    personaRef: "role:reviewer",
    verdict: "pass",
    score: 0.9,
    reason: "No findings.",
    hardVeto: false,
    ...overrides,
  };
}

describe("aggregateCouncil", () => {
  it("never authorizes: a unanimous pass is only no_objection", () => {
    const result = aggregateCouncil([
      vote(),
      vote({ personaRef: "role:security" }),
    ]);
    expect(result.outcome).toBe("no_objection");
    expect(result.meanScore).toBeCloseTo(0.9);
  });

  it("holds on a warning or a non-veto block", () => {
    expect(aggregateCouncil([vote({ verdict: "warn" })]).outcome).toBe("hold");
    const soft = aggregateCouncil([vote({ verdict: "block" })]);
    expect(soft.outcome).toBe("hold");
    expect(soft.heldBy).toEqual(["role:reviewer"]);
  });

  it("vetoes on a hard-veto block, which outranks holds", () => {
    const result = aggregateCouncil([
      vote({ verdict: "warn" }),
      vote({ personaRef: "role:security", verdict: "block", hardVeto: true }),
    ]);
    expect(result.outcome).toBe("veto");
    expect(result.vetoedBy).toEqual(["role:security"]);
  });

  it("refuses duplicate voters (clone multiplication)", () => {
    const result = aggregateCouncil([vote(), vote()]);
    expect(result.outcome).toBe("invalid");
    expect(result.problems[0]).toContain("more than once");
  });

  it("refuses self-review by the acting persona", () => {
    const result = aggregateCouncil([vote()], "role:reviewer");
    expect(result.outcome).toBe("invalid");
    expect(result.problems[0]).toContain("own proposal");
  });

  it("refuses malformed votes", () => {
    expect(aggregateCouncil([{ personaRef: "x" }]).outcome).toBe("invalid");
  });
});
