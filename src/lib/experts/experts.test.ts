import { describe, expect, it } from "vitest";
import { evaluateWarrant, initialNoesisWorkspace } from "../noesis";
import { getPersona } from "../persona/registry";
import { EXPERT_CATALOG, getExpert } from "./catalog";
import {
  compileExpertBrief,
  compileReviewBrief,
  EXPERT_MODEL,
  reviewToCouncilVote,
  verifyExpertOutput,
} from "./compile";
import { routeTask } from "./router";

describe("expert catalog", () => {
  it("has unique refs, real personas, and independent reviewers", () => {
    expect(new Set(EXPERT_CATALOG.map((e) => e.ref)).size).toBe(
      EXPERT_CATALOG.length,
    );
    for (const expert of EXPERT_CATALOG) {
      const reviewer = getExpert(expert.reviewerRef);
      expect(getPersona(expert.personaRef), expert.ref).toBeDefined();
      expect(reviewer, expert.ref).toBeDefined();
      // A reviewer on the same persona would be self-review in the council.
      expect(reviewer!.personaRef, expert.ref).not.toBe(expert.personaRef);
    }
  });
});

describe("routeTask", () => {
  const cases: [string, string][] = [
    ["Review this pull request diff for problems", "expert:code-reviewer"],
    [
      "The checkout page crashes with a stack trace after the last deploy",
      "expert:debugger",
    ],
    [
      "Should we use a monolith or microservices? Need an ADR",
      "expert:architect",
    ],
    [
      "Audit our auth flow for XSS and CSRF vulnerabilities",
      "expert:security-auditor",
    ],
    ["Make the landing page responsive on mobile", "expert:frontend-builder"],
    [
      "Write a Postgres migration to add an index to the orders table",
      "expert:data-engineer",
    ],
    [
      "Draft a PRD with acceptance criteria for onboarding",
      "expert:product-strategist",
    ],
    [
      "Add unit test coverage with vitest for the parser",
      "expert:test-engineer",
    ],
    [
      "Set up a GitHub Actions pipeline with rollback",
      "expert:release-engineer",
    ],
    ["Rewrite the README and changelog", "expert:technical-writer"],
    ["Where is the entry point in this codebase?", "expert:repo-cartographer"],
    ["Pull a tarot card for my full moon ritual", "expert:oracle-guide"],
  ];

  it.each(cases)("routes %j to %s", (task, ref) => {
    const route = routeTask(task);
    expect(route.primary?.expert.ref).toBe(ref);
    expect(route.primary?.matched.length).toBeGreaterThan(0);
    expect(route.reviewer?.ref).toBe(getExpert(ref)!.reviewerRef);
  });

  it("asks a clarifying question instead of guessing on vague input", () => {
    const route = routeTask("help me with this");
    expect(route.primary).toBeNull();
    expect(route.clarifyingQuestion).toBeTruthy();
  });

  it("matches whole words only", () => {
    // "product" must not trigger the "prod" risk term.
    expect(routeTask("Draft a product roadmap").riskSignals).toEqual([]);
  });

  it("raises effort and warrant for production risk", () => {
    const route = routeTask(
      "Debug the error in production that is causing data loss for customers",
    );
    expect(route.primary?.expert.ref).toBe("expert:debugger");
    expect(route.suggestedWarrant).toBe("high");
    expect(route.effort).toBe("xhigh");
    expect(route.effortReasons.join(" ")).toContain("risk");
  });

  it("lowers effort for a small, safe task", () => {
    const route = routeTask("Quick typo fix in the README docs");
    expect(route.primary?.expert.ref).toBe("expert:technical-writer");
    expect(route.effort).toBe("low");
    const medium = routeTask(
      "Make a small layout tweak to the button component",
    );
    expect(medium.effort).toBe("low");
  });

  it("flags when a task needs more authority than the expert's persona holds", () => {
    const route = routeTask(
      "Review the pull request that touches production billing",
    );
    expect(route.primary?.expert.ref).toBe("expert:code-reviewer");
    expect(route.suggestedWarrant).toBe("high");
    expect(route.exceedsPersonaCeiling).toBe(true);
  });

  it("suggests additional experts for multi-domain tasks", () => {
    const route = routeTask(
      "Debug the failing auth token bug and check it for security vulnerability and injection",
    );
    const refs = [
      route.primary?.expert.ref,
      ...route.alsoConsult.map((m) => m.expert.ref),
    ];
    expect(refs).toEqual(
      expect.arrayContaining(["expert:debugger", "expert:security-auditor"]),
    );
  });
});

describe("compileExpertBrief", () => {
  const debuggerExpert = getExpert("expert:debugger")!;

  it("always uses Claude Opus 5.5 and carries the routed effort", () => {
    const brief = compileExpertBrief(
      debuggerExpert,
      "  It crashes.  ",
      "xhigh",
    );
    expect(brief.model).toBe(EXPERT_MODEL);
    expect(brief.model).toBe("claude-opus-5-5");
    expect(brief.effort).toBe("xhigh");
    expect(brief.userMessage).toBe("It crashes.");
  });

  it("embeds the persona's law, forbidden actions, and the rubric", () => {
    const brief = compileExpertBrief(debuggerExpert, "x");
    const persona = getPersona(debuggerExpert.personaRef)!;
    expect(brief.system).toContain(persona.governingLaw);
    expect(brief.system).toContain("print secrets");
    for (const check of debuggerExpert.rubric)
      expect(brief.system).toContain(check);
  });

  it("requires every deliverable section in the structured-output schema", () => {
    const { outputSchema } = compileExpertBrief(debuggerExpert, "x");
    expect(outputSchema.required).toEqual([
      "root_cause",
      "fix",
      "regression_test",
      "residual_risk",
      "assumptions",
    ]);
    expect(outputSchema.additionalProperties).toBe(false);
  });
});

describe("verifyExpertOutput", () => {
  const oracle = getExpert("expert:oracle-guide")!;

  it("accepts a complete, on-voice reply", () => {
    expect(
      verifyExpertOutput(oracle, {
        reading: "The Moon is an invitation to rest in uncertainty.",
        reflection_prompt: "What might you release this week?",
        uncertainty_note: "This is not a prediction.",
        assumptions: [],
      }),
    ).toEqual({ ok: true, problems: [] });
  });

  it("rejects missing sections, extra fields, and off-voice content", () => {
    const result = verifyExpertOutput(oracle, {
      reading: "You are destined for wealth; it is guaranteed.",
      reflection_prompt: "",
      extra: "x",
    });
    expect(result.ok).toBe(false);
    expect(result.problems).toEqual(
      expect.arrayContaining([
        "missing reflection prompt (reflection_prompt)",
        "missing uncertainty note (uncertainty_note)",
        "missing assumptions list",
        "unexpected field extra",
        "banned phrase: you are destined",
        "overclaim: guaranteed",
      ]),
    );
  });

  it("rejects non-object replies", () => {
    expect(verifyExpertOutput(oracle, "text").ok).toBe(false);
  });
});

describe("independent review closes the loop into the kernel", () => {
  const author = getExpert("expert:debugger")!;
  const security = getExpert("expert:security-auditor")!;
  const reviewer = getExpert("expert:code-reviewer")!;

  it("builds a review brief constrained to the author's rubric", () => {
    const brief = compileReviewBrief(reviewer, author, "crash", { fix: "x" });
    expect(brief.system).toContain("independently reviewing");
    const checks = (
      brief.outputSchema.properties.checks as {
        items: { properties: { check: { enum: string[] } } };
      }
    ).items.properties.check.enum;
    expect(checks).toEqual(author.rubric);
  });

  it("turns a security block into a hard veto the kernel enforces", () => {
    const vote = reviewToCouncilVote(security, {
      verdict: "block",
      reason: "The fix logs the session token.",
      checks: [{ check: "x", passed: false, note: "token logged" }],
    });
    expect(vote).toMatchObject({ verdict: "block", hardVeto: true, score: 0 });

    const initial = structuredClone(initialNoesisWorkspace);
    const workspace = {
      ...initial,
      uncertainty: 0.12,
      evidence: initial.evidence.map((e) => ({
        ...e,
        status: "verified" as const,
      })),
      lease: { ...initial.lease, active: true },
      council: [vote!],
    };
    const evaluation = evaluateWarrant(workspace, "2026-11-01T00:00:00.000Z");
    expect(evaluation.decision).toBe("blocked");
    expect(evaluation.blockers.map((b) => b.code)).toEqual(["council_veto"]);
  });

  it("holds on a non-security block and ignores malformed reviews", () => {
    const vote = reviewToCouncilVote(reviewer, {
      verdict: "block",
      reason: "Test does not reproduce the bug.",
      checks: [
        { check: "a", passed: true, note: "" },
        { check: "b", passed: false, note: "" },
      ],
    });
    expect(vote).toMatchObject({ hardVeto: false, score: 0.5 });
    expect(reviewToCouncilVote(reviewer, { verdict: "maybe" })).toBeNull();
  });
});
