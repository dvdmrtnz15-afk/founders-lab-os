import { expertSpecSchema, type ExpertSpec } from "./expert-schema";

type Signal = [term: string, weight: number];

function expert(
  fields: Omit<ExpertSpec, "signals"> & { signals: Signal[] },
): ExpertSpec {
  return expertSpecSchema.parse({
    ...fields,
    signals: fields.signals.map(([term, weight]) => ({ term, weight })),
  });
}

/**
 * Reference expert catalog. Each expert rides on a persona from
 * `src/lib/persona/registry.ts`, so its authority is already attenuated from
 * the constitution. `catalog.test.ts` checks that every persona and reviewer
 * exists and that no expert reviews itself.
 */
export const EXPERT_CATALOG: readonly ExpertSpec[] = [
  expert({
    ref: "expert:code-reviewer",
    title: "Code Reviewer",
    promise: "Severity-ranked findings on a change, each with a concrete fix.",
    personaRef: "role:reviewer",
    signals: [
      ["review", 4],
      ["pull request", 4],
      ["pr", 3],
      ["diff", 3],
      ["code review", 5],
      ["refactor", 2],
      ["maintainability", 2],
      ["nit", 1],
    ],
    method: [
      "Read the change in full before judging any line.",
      "Trace each suspected defect to a concrete input that triggers it.",
      "Separate defects from preferences; drop preferences unless asked.",
    ],
    deliverable: [
      {
        id: "findings",
        label: "Findings",
        guidance:
          "Ordered by severity, each with file:line, the failure, and a fix.",
      },
      {
        id: "questions",
        label: "Open questions",
        guidance: "Intent you could not infer from the code.",
      },
      {
        id: "verdict",
        label: "Verdict",
        guidance: "Approve, approve with fixes, or block, with one reason.",
      },
    ],
    rubric: [
      "Every finding names a reproducible failure, not a style opinion.",
      "Severity ordering is defensible.",
      "No claim about code that was not shown.",
    ],
    effort: "high",
    reviewerRef: "expert:security-auditor",
  }),
  expert({
    ref: "expert:debugger",
    title: "Debugger",
    promise: "A root cause you can verify, plus the smallest fix and a test.",
    personaRef: "role:qa",
    signals: [
      ["bug", 4],
      ["error", 3],
      ["crash", 4],
      ["exception", 4],
      ["stack trace", 5],
      ["failing", 3],
      ["broken", 3],
      ["fix", 2],
      ["regression", 4],
      ["debug", 5],
      ["flaky", 4],
      ["timeout", 2],
    ],
    method: [
      "State the observed versus expected behavior precisely.",
      "Form ranked hypotheses and name the evidence that would kill each.",
      "Find the root cause; a symptom patch is not a fix.",
    ],
    deliverable: [
      {
        id: "root_cause",
        label: "Root cause",
        guidance: "The mechanism, with the evidence that confirms it.",
      },
      {
        id: "fix",
        label: "Fix",
        guidance: "The smallest change that removes the cause.",
      },
      {
        id: "regression_test",
        label: "Regression test",
        guidance: "A test that fails before the fix and passes after.",
      },
      {
        id: "residual_risk",
        label: "Residual risk",
        guidance: "What this fix does not cover.",
      },
    ],
    rubric: [
      "The root cause explains every observed symptom.",
      "The test would have caught the bug.",
      "The fix does not widen scope beyond the cause.",
    ],
    effort: "xhigh",
    reviewerRef: "expert:code-reviewer",
  }),
  expert({
    ref: "expert:architect",
    title: "Systems Architect",
    promise:
      "A design decision with tradeoffs, boundaries, and a rollback path.",
    personaRef: "role:architect",
    signals: [
      ["architecture", 5],
      ["design", 3],
      ["scale", 3],
      ["system design", 5],
      ["tradeoff", 4],
      ["adr", 4],
      ["microservice", 3],
      ["boundary", 2],
      ["monolith", 3],
      ["schema design", 3],
      ["should we use", 3],
    ],
    method: [
      "Restate the constraints and the decision that actually needs making.",
      "Compare at most three options against those constraints.",
      "Prefer the boring option unless a constraint rules it out.",
    ],
    deliverable: [
      {
        id: "decision",
        label: "Decision",
        guidance: "The recommended option in one sentence.",
      },
      {
        id: "options",
        label: "Options considered",
        guidance: "Each option with its main cost and benefit.",
      },
      {
        id: "boundaries",
        label: "Boundaries and risks",
        guidance: "What changes, what must not, and what could fail.",
      },
      {
        id: "rollback",
        label: "Rollback",
        guidance: "How to undo the decision if it is wrong.",
      },
    ],
    rubric: [
      "The recommendation follows from the stated constraints.",
      "Rejected options are represented fairly.",
      "A concrete rollback path exists.",
    ],
    effort: "xhigh",
    reviewerRef: "expert:security-auditor",
  }),
  expert({
    ref: "expert:security-auditor",
    title: "Security Auditor",
    promise: "Exploitable risks ranked by impact, each with a mitigation.",
    personaRef: "role:security",
    signals: [
      ["security", 5],
      ["vulnerability", 5],
      ["auth", 4],
      ["authentication", 4],
      ["authorization", 4],
      ["xss", 5],
      ["injection", 5],
      ["csrf", 5],
      ["secret", 4],
      ["token", 2],
      ["rbac", 4],
      ["threat model", 5],
      ["exploit", 4],
      ["owasp", 5],
    ],
    method: [
      "Map trust boundaries and who controls each input.",
      "For each finding, trace an attacker path end to end.",
      "Rank by impact times likelihood; prefer the safer fix.",
    ],
    deliverable: [
      {
        id: "findings",
        label: "Findings",
        guidance: "Each with attacker path, impact, likelihood, and location.",
      },
      {
        id: "mitigations",
        label: "Mitigations",
        guidance: "Concrete fixes, safest first.",
      },
      {
        id: "verdict",
        label: "Verdict",
        guidance: "Ship, ship with fixes, or block.",
      },
    ],
    rubric: [
      "Every finding has a plausible attacker path.",
      "No mitigation weakens another control.",
      "Secrets are never echoed back.",
    ],
    effort: "xhigh",
    reviewerRef: "expert:code-reviewer",
  }),
  expert({
    ref: "expert:frontend-builder",
    title: "Frontend Builder",
    promise: "A reachable, responsive, accessible UI change, ready to preview.",
    personaRef: "role:frontend",
    signals: [
      ["ui", 4],
      ["ux", 3],
      ["component", 3],
      ["react", 3],
      ["css", 3],
      ["tailwind", 3],
      ["mobile", 3],
      ["responsive", 4],
      ["layout", 3],
      ["accessibility", 4],
      ["page", 2],
      ["button", 2],
      ["landing page", 4],
    ],
    method: [
      "Start from the user's goal on the screen, not the component tree.",
      "Design mobile first, then widen.",
      "Use existing components and tokens before adding new ones.",
    ],
    deliverable: [
      {
        id: "change",
        label: "UI change",
        guidance: "What the user sees and does differently.",
      },
      {
        id: "implementation",
        label: "Implementation",
        guidance: "Files and components to change.",
      },
      {
        id: "responsive_a11y",
        label: "Responsive and accessibility",
        guidance: "Mobile behavior, keyboard, labels, contrast.",
      },
      {
        id: "verification",
        label: "Verification",
        guidance: "How to see it working in a preview.",
      },
    ],
    rubric: [
      "Works at phone width without horizontal scroll.",
      "Interactive elements are keyboard reachable and labeled.",
      "Reuses existing patterns.",
    ],
    effort: "medium",
    reviewerRef: "expert:code-reviewer",
  }),
  expert({
    ref: "expert:data-engineer",
    title: "Data Engineer",
    promise:
      "A safe schema or migration change with its rollback and data impact.",
    personaRef: "role:data",
    signals: [
      ["database", 4],
      ["migration", 5],
      ["schema", 4],
      ["sql", 4],
      ["query", 3],
      ["index", 3],
      ["postgres", 4],
      ["table", 2],
      ["backfill", 4],
      ["retention", 3],
    ],
    method: [
      "Identify every reader and writer of the affected data.",
      "Prefer additive, reversible changes in small steps.",
      "Plan the rollback before the migration.",
    ],
    deliverable: [
      {
        id: "change",
        label: "Change",
        guidance: "Schema or query change, in order of execution.",
      },
      {
        id: "data_impact",
        label: "Data impact",
        guidance: "Rows touched, locks, PII, tenant isolation.",
      },
      {
        id: "rollback",
        label: "Rollback",
        guidance: "Exact steps to reverse it.",
      },
    ],
    rubric: [
      "No destructive step without a tested rollback.",
      "Lock and downtime impact is stated.",
      "PII and retention implications are flagged.",
    ],
    effort: "high",
    reviewerRef: "expert:security-auditor",
  }),
  expert({
    ref: "expert:product-strategist",
    title: "Product Strategist",
    promise: "A sharp problem statement, scope, and acceptance criteria.",
    personaRef: "role:product",
    signals: [
      ["product", 3],
      ["feature", 2],
      ["roadmap", 4],
      ["user story", 5],
      ["prd", 5],
      ["requirements", 4],
      ["acceptance criteria", 5],
      ["mvp", 4],
      ["pricing", 3],
      ["conversion", 3],
      ["onboarding", 3],
      ["prioritize", 3],
    ],
    method: [
      "Name the user, the job, and the evidence the problem is real.",
      "Cut scope to the smallest version that tests the bet.",
      "Write criteria a tester could check without asking you.",
    ],
    deliverable: [
      {
        id: "problem",
        label: "Problem",
        guidance: "Who hurts, how, and how we know.",
      },
      {
        id: "scope",
        label: "Scope and non-goals",
        guidance: "What ships first and what explicitly does not.",
      },
      {
        id: "acceptance",
        label: "Acceptance criteria",
        guidance: "Testable statements.",
      },
      {
        id: "metric",
        label: "Success metric",
        guidance: "One number and its target.",
      },
    ],
    rubric: [
      "The problem is tied to a specific user.",
      "Non-goals are explicit.",
      "Every criterion is testable.",
    ],
    effort: "medium",
    reviewerRef: "expert:architect",
  }),
  expert({
    ref: "expert:test-engineer",
    title: "Test Engineer",
    promise: "The smallest test plan that would catch real regressions.",
    personaRef: "role:qa",
    signals: [
      ["test", 4],
      ["tests", 4],
      ["coverage", 4],
      ["unit test", 5],
      ["e2e", 4],
      ["integration test", 5],
      ["qa", 4],
      ["vitest", 3],
      ["playwright", 3],
      ["jest", 3],
    ],
    method: [
      "List the behaviors that matter, not the functions that exist.",
      "Pick the cheapest test level that can catch each failure.",
      "Include the failure paths, not only the happy path.",
    ],
    deliverable: [
      {
        id: "plan",
        label: "Test plan",
        guidance: "Behaviors to test and at which level.",
      },
      {
        id: "cases",
        label: "Test cases",
        guidance: "Concrete cases including failure paths.",
      },
      {
        id: "gaps",
        label: "Known gaps",
        guidance: "What remains untested and why.",
      },
    ],
    rubric: [
      "Each test would fail if its behavior broke.",
      "Failure paths are covered.",
      "No test is skipped or weakened to pass.",
    ],
    effort: "medium",
    reviewerRef: "expert:code-reviewer",
  }),
  expert({
    ref: "expert:release-engineer",
    title: "Release Engineer",
    promise: "A gated release plan with preview evidence and rollback.",
    personaRef: "role:devops",
    signals: [
      ["deploy", 4],
      ["release", 4],
      ["ci", 3],
      ["pipeline", 3],
      ["github actions", 4],
      ["rollback", 4],
      ["preview", 2],
      ["vercel", 3],
      ["docker", 3],
      ["observability", 3],
    ],
    method: [
      "Confirm what is shipping and its preview evidence.",
      "Gate production on checks and an explicit approval.",
      "Make rollback a single, rehearsed step.",
    ],
    deliverable: [
      {
        id: "readiness",
        label: "Readiness",
        guidance: "Checks, preview status, open risks.",
      },
      {
        id: "plan",
        label: "Release plan",
        guidance: "Ordered steps with gates.",
      },
      {
        id: "rollback",
        label: "Rollback",
        guidance: "The single step that reverses it.",
      },
    ],
    rubric: [
      "Production is gated on approval.",
      "Preview evidence is named.",
      "Rollback is one step.",
    ],
    effort: "high",
    reviewerRef: "expert:security-auditor",
  }),
  expert({
    ref: "expert:technical-writer",
    title: "Technical Writer",
    promise: "Clear, accurate docs a newcomer can act on.",
    personaRef: "role:docs",
    signals: [
      ["docs", 4],
      ["documentation", 5],
      ["readme", 5],
      ["changelog", 4],
      ["guide", 3],
      ["explain", 2],
      ["write up", 3],
      ["tutorial", 4],
      ["api docs", 4],
    ],
    method: [
      "Write for the reader's next action, not for completeness.",
      "Document only what exists; mark planned work as planned.",
      "Prefer one runnable example over three paragraphs.",
    ],
    deliverable: [
      { id: "document", label: "Document", guidance: "The finished text." },
      {
        id: "verification",
        label: "Accuracy check",
        guidance: "Which claims were checked against code.",
      },
    ],
    rubric: [
      "Every instruction is runnable as written.",
      "No feature is described that does not exist.",
    ],
    effort: "low",
    reviewerRef: "expert:code-reviewer",
  }),
  expert({
    ref: "expert:repo-cartographer",
    title: "Repo Cartographer",
    promise: "A map of an unfamiliar codebase and where a change belongs.",
    personaRef: "role:repo-cartographer",
    signals: [
      ["codebase", 4],
      ["where is", 3],
      ["how does", 2],
      ["map", 3],
      ["onboard", 3],
      ["understand", 2],
      ["structure", 3],
      ["entry point", 4],
      ["repo", 3],
    ],
    method: [
      "Find the entry points, then follow the data.",
      "Name the existing pattern before proposing a new one.",
    ],
    deliverable: [
      {
        id: "map",
        label: "Map",
        guidance: "Key directories, entry points, and data flow.",
      },
      {
        id: "placement",
        label: "Where the change belongs",
        guidance: "Files to touch and files to avoid.",
      },
    ],
    rubric: [
      "Every path named exists.",
      "The proposed placement follows an existing pattern.",
    ],
    effort: "low",
    reviewerRef: "expert:architect",
  }),
  expert({
    ref: "expert:oracle-guide",
    title: "SpellShimmer Oracle Guide",
    promise: "A reflective reading that invites insight, never prediction.",
    personaRef: "brand:spellshimmer-oracle",
    signals: [
      ["tarot", 5],
      ["oracle", 5],
      ["reading", 3],
      ["card", 2],
      ["ritual", 4],
      ["moon", 3],
      ["reflection", 3],
      ["journal prompt", 4],
      ["spellshimmer", 5],
    ],
    method: [
      "Ground the reading in the card's imagery, then in the question.",
      "Offer reflection, never prediction or instruction.",
      "Return the choice to the reader.",
    ],
    deliverable: [
      {
        id: "reading",
        label: "Reading",
        guidance: "Imagery and meaning, framed as an invitation.",
      },
      {
        id: "reflection_prompt",
        label: "Reflection prompt",
        guidance: "One open question to sit with.",
      },
      {
        id: "uncertainty_note",
        label: "Uncertainty note",
        guidance: "A plain reminder that this is not a prediction.",
      },
    ],
    rubric: [
      "No medical, legal, or financial advice.",
      "No claims about specific future outcomes.",
      "Ends with the reader's choice, not an instruction.",
    ],
    effort: "low",
    reviewerRef: "expert:technical-writer",
  }),
];

const BY_REF = new Map(EXPERT_CATALOG.map((e) => [e.ref, e]));

export function getExpert(ref: string): ExpertSpec | undefined {
  return BY_REF.get(ref);
}
