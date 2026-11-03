import { describe, expect, it } from "vitest";
import { consultExpert } from "./claude-expert";

/**
 * End-to-end check against the real Claude API. Costs money; excluded from
 * `pnpm test` and CI. Run with `pnpm test:live` where ANTHROPIC_API_KEY (or
 * an `ant auth login` profile) is available.
 */
const hasCredentials = Boolean(
  process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN,
);

describe.skipIf(!hasCredentials)("live expert consultation", () => {
  it("routes, answers on contract, and gets an independent review", async () => {
    const task = [
      "Review this pull request diff before we merge:",
      "",
      "-export function add(a: number, b: number) { return a + b; }",
      "+export function add(a: number, b: number) { return a - b; }",
    ].join("\n");

    const result = await consultExpert(task);

    console.info(
      JSON.stringify(
        {
          expert: result.expert?.ref,
          effort: result.route.effort,
          servedBy: result.answer?.servedBy,
          answerOk: result.answer?.ok,
          contractProblems: result.check?.problems,
          review: result.vote,
          accepted: result.accepted,
          summary: result.summary,
        },
        null,
        2,
      ),
    );

    expect(result.expert?.ref).toBe("expert:code-reviewer");
    expect(result.answer?.ok).toBe(true);
    expect(result.check).toEqual({ ok: true, problems: [] });
    // The reviewer must return a well-formed verdict; which verdict is the
    // model's call, so it is reported rather than asserted.
    expect(result.vote).not.toBeNull();
  });
});
