import type Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it, vi } from "vitest";
import { runWarranted, verifyExecutionReceipt } from "../../executor/executor";
import { initialNoesisWorkspace } from "../../noesis";
import { getPersona, TOOLS } from "../../persona/registry";
import { generateSigningKey } from "../../signing";
import { getExpert } from "../catalog";
import { compileExpertBrief } from "../compile";
import {
  consultExpert,
  createExpertAdapter,
  FALLBACK_BETA,
  runBrief,
} from "./claude-expert";

type FakeReply = {
  stop_reason?: string;
  model?: string;
  text?: string;
  explanation?: string;
};

/** Stand-in for the SDK client: records requests, replays canned replies. */
function fakeClient(replies: FakeReply[]) {
  const create = vi.fn(async () => {
    const reply = replies.shift();
    if (!reply) throw new Error("no more fake replies");
    return {
      model: reply.model ?? "claude-opus-5-5",
      stop_reason: reply.stop_reason ?? "end_turn",
      stop_details:
        reply.stop_reason === "refusal"
          ? {
              type: "refusal",
              category: "cyber",
              explanation: reply.explanation ?? "declined",
            }
          : null,
      content:
        reply.text === undefined ? [] : [{ type: "text", text: reply.text }],
      usage: { input_tokens: 100, output_tokens: 50 },
    };
  });
  const client = { beta: { messages: { create } } } as unknown as Anthropic;
  return { client, create };
}

const debuggerAnswer = {
  root_cause: "The cart total is read before the async price fetch resolves.",
  fix: "Await the price fetch before computing the total.",
  regression_test: "Mock a slow price fetch and assert the total is correct.",
  residual_risk: "Other callers of the price cache are not covered.",
  assumptions: ["The crash is in checkout, per the report."],
};

const passReview = {
  verdict: "pass",
  reason: "Root cause explains the crash and the test reproduces it.",
  checks: [
    {
      check: "The root cause explains every observed symptom.",
      passed: true,
      note: "",
    },
    { check: "The test would have caught the bug.", passed: true, note: "" },
  ],
};

describe("runBrief", () => {
  const brief = compileExpertBrief(
    getExpert("expert:debugger")!,
    "Checkout crashes",
    "xhigh",
  );

  it("sends the brief on Claude Opus 5.5 with effort, schema, and refusal fallback", async () => {
    const { client, create } = fakeClient([
      { text: JSON.stringify(debuggerAnswer) },
    ]);
    const result = await runBrief(client, brief);

    expect(result.ok).toBe(true);
    const request = (create.mock.calls[0] as unknown[])[0] as Record<
      string,
      unknown
    >;
    expect(request).toMatchObject({
      model: "claude-opus-5-5",
      betas: [FALLBACK_BETA],
      fallbacks: "default",
      system: brief.system,
      messages: [{ role: "user", content: "Checkout crashes" }],
      output_config: {
        effort: "xhigh",
        format: { type: "json_schema", schema: brief.outputSchema },
      },
    });
    // Sampling parameters are rejected on current models.
    expect(request).not.toHaveProperty("temperature");
  });

  it("reports which model served the answer after a fallback", async () => {
    const { client } = fakeClient([
      { model: "claude-opus-4-8", text: JSON.stringify(debuggerAnswer) },
    ]);
    const result = await runBrief(client, brief);
    expect(result.ok && result.servedBy).toBe("claude-opus-4-8");
  });

  it("never reads content from a refusal, truncation, or malformed reply", async () => {
    const { client } = fakeClient([
      { stop_reason: "refusal", explanation: "cyber", text: "{}" },
      { stop_reason: "max_tokens", text: '{"root_cause": "partial' },
      { text: "not json" },
      {},
    ]);
    expect(await runBrief(client, brief)).toMatchObject({
      ok: false,
      reason: "refusal",
    });
    expect(await runBrief(client, brief)).toMatchObject({
      ok: false,
      reason: "max_tokens",
    });
    expect(await runBrief(client, brief)).toMatchObject({
      ok: false,
      reason: "invalid_json",
    });
    expect(await runBrief(client, brief)).toMatchObject({
      ok: false,
      reason: "no_text",
    });
  });
});

describe("consultExpert", () => {
  it("routes, answers, verifies, and gets an independent review", async () => {
    const { client, create } = fakeClient([
      { text: JSON.stringify(debuggerAnswer) },
      { text: JSON.stringify(passReview) },
    ]);
    const result = await consultExpert(
      "The checkout page crashes with a stack trace after the last deploy",
      { client },
    );

    expect(result.expert?.ref).toBe("expert:debugger");
    expect(result.check).toEqual({ ok: true, problems: [] });
    expect(result.vote).toMatchObject({
      personaRef: "role:reviewer",
      verdict: "pass",
      score: 1,
    });
    expect(result.accepted).toBe(true);
    // The reviewer sees the author's work, not just the task.
    const reviewRequest = (create.mock.calls[1] as unknown[])[0] as {
      system: string;
      messages: { content: string }[];
    };
    expect(reviewRequest.system).toContain("independently reviewing");
    expect(reviewRequest.messages[0].content).toContain(
      debuggerAnswer.root_cause,
    );
  });

  it("does not spend a review on an answer that broke its contract", async () => {
    const { client, create } = fakeClient([
      { text: JSON.stringify({ root_cause: "x" }) },
    ]);
    const result = await consultExpert("Debug the crash in checkout", {
      client,
    });
    expect(result.accepted).toBe(false);
    expect(result.check?.ok).toBe(false);
    expect(create).toHaveBeenCalledTimes(1);
    expect(result.summary).toContain("broke its contract");
  });

  it("rejects work the reviewer blocks", async () => {
    const { client } = fakeClient([
      { text: JSON.stringify(debuggerAnswer) },
      {
        text: JSON.stringify({
          ...passReview,
          verdict: "block",
          reason: "Test does not reproduce it.",
        }),
      },
    ]);
    const result = await consultExpert("Debug the crash in checkout", {
      client,
    });
    expect(result.vote?.verdict).toBe("block");
    expect(result.accepted).toBe(false);
  });

  it("asks instead of calling Claude when the task cannot be routed", async () => {
    const { client, create } = fakeClient([]);
    const result = await consultExpert("help", { client });
    expect(result.expert).toBeNull();
    expect(create).not.toHaveBeenCalled();
    expect(result.summary).toContain("?");
  });
});

describe("consulting an expert through the signed executor", async () => {
  const signer = await generateSigningKey();
  const governor = getPersona("role:noesis-governor")!;

  function workspace() {
    const initial = structuredClone(initialNoesisWorkspace);
    return {
      ...initial,
      uncertainty: 0.12,
      persona: governor,
      evidence: initial.evidence.map((e) => ({
        ...e,
        status: "verified" as const,
      })),
      lease: { ...initial.lease, active: true, tools: [TOOLS.consultExpert] },
    };
  }

  it("runs only under a lease and returns a signed, verifiable receipt", async () => {
    const { client } = fakeClient([
      { text: JSON.stringify(debuggerAnswer) },
      { text: JSON.stringify(passReview) },
    ]);
    const { receipt, workspace: after } = await runWarranted(
      workspace(),
      [
        {
          id: "consult",
          tool: TOOLS.consultExpert,
          description: "Ask the Debugger",
          input: { task: "Debug the crash in checkout after deploy" },
        },
      ],
      { adapters: [createExpertAdapter({ client })], signer },
    );

    expect(receipt.payload.outcome).toBe("executed");
    expect(receipt.payload.steps[0].detail).toContain("voted pass");
    expect(after.lease.active).toBe(false);
    expect(
      (await verifyExecutionReceipt(receipt, new Set([signer.keyId]))).ok,
    ).toBe(true);
  });

  it("refuses before calling Claude when the persona may not consult experts", async () => {
    const { client, create } = fakeClient([]);
    const { receipt } = await runWarranted(
      {
        ...workspace(),
        persona: getPersona("role:reviewer")!,
        warrantLevel: "low" as const,
      },
      [
        {
          id: "consult",
          tool: TOOLS.consultExpert,
          description: "Ask",
          input: { task: "Debug the crash" },
        },
      ],
      { adapters: [createExpertAdapter({ client })], signer },
    );
    expect(receipt.payload.outcome).toBe("refused");
    expect(create).not.toHaveBeenCalled();
  });
});
