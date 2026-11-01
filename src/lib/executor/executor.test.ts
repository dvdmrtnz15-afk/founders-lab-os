import { describe, expect, it } from "vitest";
import { initialNoesisWorkspace } from "../noesis";
import type { NoesisWorkspace } from "../noesis-schema";
import {
  getPersona,
  SPELLSHIMMER_ORACLE_PERSONA,
  TOOLS,
} from "../persona/registry";
import { generateSigningKey } from "../signing";
import {
  runWarranted,
  signPersona,
  verifyExecutionReceipt,
  type PlannedStep,
  type ToolAdapter,
} from "./executor";
import { createCommandAdapter } from "./node/command-adapter";

const governor = getPersona("role:noesis-governor")!;
const clock = () => "2026-11-01T00:00:00.000Z";

function allowedWorkspace(
  overrides: Partial<NoesisWorkspace> = {},
): NoesisWorkspace {
  const initial = structuredClone(initialNoesisWorkspace);
  return {
    ...initial,
    uncertainty: 0.12,
    evidence: initial.evidence.map((item) => ({
      ...item,
      status: "verified" as const,
    })),
    lease: { ...initial.lease, active: true },
    ...overrides,
  };
}

type Log = string[];

function fakeAdapter(
  tool: string,
  log: Log,
  behavior: {
    throws?: boolean;
    verifyOk?: boolean;
    text?: string;
    compensate?: "ok" | "throws" | "none";
    hang?: boolean;
  } = {},
): ToolAdapter {
  const adapter: ToolAdapter = {
    tool,
    describe: () => `fake ${tool}`,
    async execute(_input, { signal }) {
      log.push(`execute:${tool}`);
      if (behavior.hang) {
        await new Promise((_, reject) =>
          signal.addEventListener("abort", () => reject(new Error("aborted"))),
        );
      }
      if (behavior.throws) throw new Error(`${tool} exploded`);
      return { summary: `${tool} done.`, text: behavior.text };
    },
    async verify() {
      log.push(`verify:${tool}`);
      return behavior.verifyOk === false
        ? { ok: false, detail: `${tool} check failed` }
        : { ok: true, detail: "ok" };
    },
  };
  if (behavior.compensate !== "none") {
    adapter.compensate = async () => {
      log.push(`compensate:${tool}`);
      if (behavior.compensate === "throws") throw new Error("cannot undo");
    };
  }
  return adapter;
}

const steps: PlannedStep[] = [
  { id: "s1", tool: "read workspace", description: "Read", input: {} },
  { id: "s2", tool: "run checks", description: "Check", input: {} },
];

describe("runWarranted", async () => {
  const signer = await generateSigningKey();
  const trusted = new Set([signer.keyId]);

  it("executes, verifies, revokes the lease, and signs the receipt", async () => {
    const log: Log = [];
    const { workspace, receipt } = await runWarranted(
      allowedWorkspace({ persona: governor }),
      steps,
      {
        adapters: [
          fakeAdapter("read workspace", log),
          fakeAdapter("run checks", log),
        ],
        signer,
        now: clock,
        receiptId: "exec-ok",
      },
    );

    expect(log).toEqual([
      "execute:read workspace",
      "verify:read workspace",
      "execute:run checks",
      "verify:run checks",
    ]);
    expect(receipt.payload.outcome).toBe("executed");
    expect(receipt.payload.steps.map((s) => s.status)).toEqual([
      "verified",
      "verified",
    ]);
    expect(receipt.payload.personaRef).toBe(governor.ref);
    expect(workspace.lease.active).toBe(false);
    expect(workspace.audit[0].kind).toBe("execution_completed");
    expect((await verifyExecutionReceipt(receipt, trusted)).ok).toBe(true);
  });

  it("refuses without executing when the warrant is not allowed", async () => {
    const log: Log = [];
    const { workspace, receipt } = await runWarranted(
      initialNoesisWorkspace,
      steps,
      {
        adapters: [
          fakeAdapter("read workspace", log),
          fakeAdapter("run checks", log),
        ],
        signer,
        now: clock,
      },
    );
    expect(log).toEqual([]);
    expect(receipt.payload.outcome).toBe("refused");
    expect(receipt.payload.refusals[0]).toMatch(/^warrant verify:/);
    // A refusal does not consume the lease.
    expect(workspace.lease.active).toBe(initialNoesisWorkspace.lease.active);
    expect(workspace.audit[0].kind).toBe("execution_refused");
    expect((await verifyExecutionReceipt(receipt, trusted)).ok).toBe(true);
  });

  it("refuses the whole plan if any step is off-lease, off-persona, or unadapted", async () => {
    const log: Log = [];
    const { receipt } = await runWarranted(
      allowedWorkspace({ persona: governor }),
      [
        ...steps,
        { id: "s3", tool: "git push", description: "Push", input: {} },
        { id: "s4", tool: "open localhost", description: "Open", input: {} },
      ],
      {
        adapters: [
          fakeAdapter("read workspace", log),
          fakeAdapter("run checks", log),
          fakeAdapter("git push", log),
        ],
        signer,
        now: clock,
      },
    );
    expect(log).toEqual([]);
    expect(receipt.payload.refusals).toEqual([
      'step s3: "git push" is not on the lease',
      'step s3: role:noesis-governor may not use "git push"',
      'step s4: no adapter for "open localhost"',
    ]);
  });

  it("refuses duplicate ids, empty plans, and plans over the step cap", async () => {
    const base = {
      adapters: [fakeAdapter("read workspace", [])],
      signer,
      now: clock,
    };
    const dup = await runWarranted(
      allowedWorkspace(),
      [steps[0], steps[0]],
      base,
    );
    expect(dup.receipt.payload.refusals).toContain("duplicate step id s1");
    const empty = await runWarranted(allowedWorkspace(), [], base);
    expect(empty.receipt.payload.refusals).toContain("no steps planned");
    const over = await runWarranted(allowedWorkspace(), [steps[0]], {
      ...base,
      maxSteps: 0,
    });
    expect(over.receipt.payload.refusals[0]).toContain("exceed the cap");
  });

  it("rolls back completed steps newest-first when verification fails", async () => {
    const log: Log = [];
    const { workspace, receipt } = await runWarranted(
      allowedWorkspace(),
      steps,
      {
        adapters: [
          fakeAdapter("read workspace", log),
          fakeAdapter("run checks", log, { verifyOk: false }),
        ],
        signer,
        now: clock,
      },
    );
    expect(log.slice(-2)).toEqual([
      "compensate:run checks",
      "compensate:read workspace",
    ]);
    expect(receipt.payload.outcome).toBe("rolled_back");
    expect(receipt.payload.steps.map((s) => s.status)).toEqual([
      "compensated",
      "compensated",
    ]);
    expect(workspace.lease.active).toBe(false);
  });

  it("reports failed when a step cannot be undone", async () => {
    const log: Log = [];
    const { receipt } = await runWarranted(allowedWorkspace(), steps, {
      adapters: [
        fakeAdapter("read workspace", log, { compensate: "none" }),
        fakeAdapter("run checks", log, {
          verifyOk: false,
          compensate: "throws",
        }),
      ],
      signer,
      now: clock,
    });
    expect(receipt.payload.outcome).toBe("failed");
    expect(receipt.payload.steps.map((s) => s.status)).toEqual([
      "compensation_failed",
      "compensation_failed",
    ]);
    expect(receipt.payload.residualRisk).toContain("Manual review");
  });

  it("treats a thrown step as unknown effects, never a clean rollback", async () => {
    const { receipt } = await runWarranted(allowedWorkspace(), steps, {
      adapters: [
        fakeAdapter("read workspace", []),
        fakeAdapter("run checks", [], { throws: true }),
      ],
      signer,
      now: clock,
    });
    expect(receipt.payload.outcome).toBe("failed");
    expect(receipt.payload.steps[1].status).toBe("errored");
  });

  it("times out a hung step", async () => {
    const { receipt } = await runWarranted(allowedWorkspace(), [steps[0]], {
      adapters: [fakeAdapter("read workspace", [], { hang: true })],
      signer,
      now: clock,
      stepTimeoutMs: 20,
    });
    expect(receipt.payload.steps[0].detail).toContain("timed out");
    expect(receipt.payload.outcome).toBe("failed");
  });

  it("honors the operator stop signal before the run", async () => {
    const controller = new AbortController();
    controller.abort();
    const log: Log = [];
    const { receipt } = await runWarranted(allowedWorkspace(), steps, {
      adapters: [
        fakeAdapter("read workspace", log),
        fakeAdapter("run checks", log),
      ],
      signer,
      now: clock,
      signal: controller.signal,
    });
    expect(log).toEqual([]);
    expect(receipt.payload.refusals).toContain("operator stop signal is set");
  });

  it("fails verification when output breaks the persona's voice", async () => {
    const oracleSteps: PlannedStep[] = [
      {
        id: "r1",
        tool: TOOLS.generateReading,
        description: "Reading",
        input: {},
      },
    ];
    const workspace = allowedWorkspace({
      warrantLevel: "low",
      persona: SPELLSHIMMER_ORACLE_PERSONA,
      lease: {
        ...allowedWorkspace().lease,
        tools: [TOOLS.generateReading],
      },
    });
    const bad = await runWarranted(workspace, oracleSteps, {
      adapters: [
        fakeAdapter(TOOLS.generateReading, [], {
          text: "You are destined for wealth.",
        }),
      ],
      signer,
      now: clock,
    });
    expect(bad.receipt.payload.outcome).toBe("rolled_back");
    expect(bad.receipt.payload.steps[0].detail).toContain("voice rules");

    const good = await runWarranted(workspace, oracleSteps, {
      adapters: [
        fakeAdapter(TOOLS.generateReading, [], {
          text: "The Moon is an invitation to rest; this is not a prediction.",
        }),
      ],
      signer,
      now: clock,
    });
    expect(good.receipt.payload.outcome).toBe("executed");
  });

  describe("signed persona trust", async () => {
    const issuer = await generateSigningKey();
    const trust = new Set([issuer.keyId]);
    const adapters = [
      fakeAdapter("read workspace", []),
      fakeAdapter("run checks", []),
    ];

    it("runs only with a trusted signature over the exact attached persona", async () => {
      const envelope = await signPersona(governor, issuer, clock());
      const ok = await runWarranted(
        allowedWorkspace({ persona: governor }),
        steps,
        {
          adapters,
          signer,
          now: clock,
          personaTrust: { envelope, trustedKeyIds: trust },
        },
      );
      expect(ok.receipt.payload.outcome).toBe("executed");
    });

    it("refuses a missing, untrusted, or mismatched persona signature", async () => {
      const workspace = allowedWorkspace({ persona: governor });
      const missing = await runWarranted(workspace, steps, {
        adapters,
        signer,
        now: clock,
        personaTrust: { trustedKeyIds: trust },
      });
      expect(missing.receipt.payload.refusals).toContain(
        "a signed persona is required but no signature was given",
      );

      const rogue = await generateSigningKey();
      const untrusted = await runWarranted(workspace, steps, {
        adapters,
        signer,
        now: clock,
        personaTrust: {
          envelope: await signPersona(governor, rogue),
          trustedKeyIds: trust,
        },
      });
      expect(untrusted.receipt.payload.refusals[0]).toContain("is not trusted");

      const widened = { ...governor, version: 2 };
      const mismatch = await runWarranted(
        allowedWorkspace({ persona: widened }),
        steps,
        {
          adapters,
          signer,
          now: clock,
          personaTrust: {
            envelope: await signPersona(governor, issuer),
            trustedKeyIds: trust,
          },
        },
      );
      expect(mismatch.receipt.payload.refusals).toContain(
        "signed persona does not match the attached persona",
      );

      const none = await runWarranted(allowedWorkspace(), steps, {
        adapters,
        signer,
        now: clock,
        personaTrust: { trustedKeyIds: trust },
      });
      expect(none.receipt.payload.refusals).toContain(
        "a signed persona is required but none is attached",
      );
    });
  });

  it("detects a tampered execution receipt", async () => {
    const { receipt } = await runWarranted(allowedWorkspace(), steps, {
      adapters: [
        fakeAdapter("read workspace", []),
        fakeAdapter("run checks", []),
      ],
      signer,
      now: clock,
    });
    const tampered = {
      ...receipt,
      payload: {
        ...receipt.payload,
        outcome: "executed" as const,
        refusals: ["x"],
      },
    };
    expect((await verifyExecutionReceipt(tampered, trusted)).ok).toBe(false);
  });
});

describe("command adapter (real processes)", async () => {
  const signer = await generateSigningKey();
  const node = process.execPath;

  function workspaceFor(tool: string) {
    return allowedWorkspace({
      lease: { ...allowedWorkspace().lease, tools: [tool] },
    });
  }

  it("runs a fixed command with no shell and verifies exit 0", async () => {
    const adapter = createCommandAdapter({
      tool: "run checks",
      command: node,
      args: ["-e", "console.log('checks passed')"],
      cwd: process.cwd(),
      readOnly: true,
    });
    const { receipt } = await runWarranted(
      workspaceFor("run checks"),
      [{ id: "c1", tool: "run checks", description: "Run", input: {} }],
      { adapters: [adapter], signer, now: clock },
    );
    expect(receipt.payload.outcome).toBe("executed");
    expect(receipt.payload.steps[0].detail).toContain("exited 0");
  });

  it("does not pass host secrets to the child process", async () => {
    process.env.FOUNDERLAB_TEST_SECRET = "do-not-leak";
    try {
      const adapter = createCommandAdapter({
        tool: "run checks",
        command: node,
        args: [
          "-e",
          "process.exit(process.env.FOUNDERLAB_TEST_SECRET === undefined ? 0 : 3)",
        ],
        cwd: process.cwd(),
        readOnly: true,
      });
      const { receipt } = await runWarranted(
        workspaceFor("run checks"),
        [{ id: "c1", tool: "run checks", description: "Run", input: {} }],
        { adapters: [adapter], signer, now: clock },
      );
      expect(receipt.payload.outcome).toBe("executed");
    } finally {
      delete process.env.FOUNDERLAB_TEST_SECRET;
    }
  });

  it("fails verification on a non-zero exit and rolls back read-only steps", async () => {
    const adapter = createCommandAdapter({
      tool: "run checks",
      command: node,
      args: ["-e", "console.error('2 tests failed'); process.exit(1)"],
      cwd: process.cwd(),
      readOnly: true,
    });
    const { receipt } = await runWarranted(
      workspaceFor("run checks"),
      [{ id: "c1", tool: "run checks", description: "Run", input: {} }],
      { adapters: [adapter], signer, now: clock },
    );
    expect(receipt.payload.outcome).toBe("rolled_back");
    expect(receipt.payload.steps[0].detail).toContain("2 tests failed");
  });

  it("rejects step input, so callers cannot add arguments", async () => {
    const adapter = createCommandAdapter({
      tool: "run checks",
      command: node,
      args: ["-e", "0"],
      cwd: process.cwd(),
      readOnly: true,
    });
    const { receipt } = await runWarranted(
      workspaceFor("run checks"),
      [
        {
          id: "c1",
          tool: "run checks",
          description: "Run",
          input: { args: ["; rm -rf /"] },
        },
      ],
      { adapters: [adapter], signer, now: clock },
    );
    expect(receipt.payload.steps[0].status).toBe("errored");
    expect(receipt.payload.steps[0].detail).toContain("take no input");
  });

  it("stops a command that outlives the step timeout", async () => {
    const adapter = createCommandAdapter({
      tool: "run checks",
      command: node,
      args: ["-e", "setTimeout(() => {}, 10000)"],
      cwd: process.cwd(),
      readOnly: true,
    });
    const { receipt } = await runWarranted(
      workspaceFor("run checks"),
      [{ id: "c1", tool: "run checks", description: "Run", input: {} }],
      { adapters: [adapter], signer, now: clock, stepTimeoutMs: 300 },
    );
    expect(receipt.payload.outcome).toBe("failed");
    expect(receipt.payload.steps[0].status).toBe("errored");
  });
});
