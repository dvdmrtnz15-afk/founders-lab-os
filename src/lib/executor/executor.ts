import { appendAudit, authorityFingerprint, evaluateWarrant } from "../noesis";
import type { NoesisWorkspace } from "../noesis-schema";
import { personaFingerprint, toolPermitted } from "../persona/persona";
import {
  normalizeTool,
  parsePersonaSpec,
  type PersonaSpec,
} from "../persona/persona-schema";
import { lintPersonaOutput } from "../persona/stylometric";
import {
  sha256Canonical,
  signPayload,
  verifyEnvelope,
  type SignedEnvelope,
  type SigningKey,
} from "../signing";

/**
 * Warranted executor: the step after an ALLOW decision.
 *
 *   evaluate → preflight every step → execute → verify → (compensate) → receipt
 *
 * Nothing executes unless the kernel allows the workspace and every planned
 * step passes preflight. The adapter lifecycle follows the free-agents
 * capsule spec (execute / verify / compensate). The lease is single-use: any
 * run that starts revokes it. Every call, refused or not, returns a signed
 * receipt, so a refusal is as auditable as a success.
 */

export type StepOutput = {
  /** One-line, non-sensitive summary for the receipt. */
  summary: string;
  /** Text produced for a person, if any; linted against the persona voice. */
  text?: string;
  /** Structured result; only its digest enters the receipt. */
  data?: unknown;
};

export type ToolAdapter = {
  /** Lease tool this adapter implements, e.g. "run checks". */
  tool: string;
  describe(): string;
  execute(
    input: unknown,
    context: { signal: AbortSignal },
  ): Promise<StepOutput>;
  verify(
    input: unknown,
    output: StepOutput,
  ): Promise<{ ok: boolean; detail: string }>;
  /** Undo a completed step. Steps without it cannot be rolled back. */
  compensate?(input: unknown, output: StepOutput): Promise<void>;
};

export type PlannedStep = {
  id: string;
  tool: string;
  description: string;
  input: unknown;
};

export type StepStatus =
  | "verified"
  | "verification_failed"
  | "errored"
  | "compensated"
  | "compensation_failed"
  | "not_run";

export type ExecutionStepRecord = {
  id: string;
  tool: string;
  description: string;
  inputDigest: string;
  outputDigest: string | null;
  status: StepStatus;
  detail: string;
};

export type ExecutionOutcome =
  | "executed"
  | "rolled_back"
  | "failed"
  | "refused";

export type ExecutionReceipt = {
  schema: "founderlab.execution-receipt.v1";
  receiptId: string;
  workspaceId: string;
  issuedAt: string;
  outcome: ExecutionOutcome;
  /** Why execution was refused before any step ran. */
  refusals: string[];
  warrantLevel: NoesisWorkspace["warrantLevel"];
  objective: string;
  authorityFingerprint: string;
  personaRef: string | null;
  personaFingerprint: string | null;
  lease: { scope: string; tools: string[]; budget: string };
  steps: ExecutionStepRecord[];
  residualRisk: string;
};

export const EXECUTION_RECEIPT_PURPOSE = "execution-receipt";
export const PERSONA_PURPOSE = "persona";

export type RunOptions = {
  adapters: readonly ToolAdapter[];
  /** Key that signs the receipt. */
  signer: SigningKey;
  /**
   * When set, the workspace must carry a persona, and `envelope` must be a
   * persona signed by one of `trustedKeyIds` whose content matches it.
   */
  personaTrust?: {
    envelope?: SignedEnvelope<PersonaSpec>;
    trustedKeyIds: ReadonlySet<string>;
  };
  /** Hard cap on planned steps. Default 8. */
  maxSteps?: number;
  /** Per-step time limit, covering execute and verify. Default 60 s. */
  stepTimeoutMs?: number;
  /** Operator kill switch; checked before every step. */
  signal?: AbortSignal;
  now?: () => string;
  receiptId?: string;
};

export type RunResult = {
  workspace: NoesisWorkspace;
  receipt: SignedEnvelope<ExecutionReceipt>;
};

class StepTimeout extends Error {}

async function withTimeout<T>(
  run: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
  outer?: AbortSignal,
): Promise<T> {
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  outer?.addEventListener("abort", onAbort, { once: true });
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      run(controller.signal),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(new StepTimeout(`timed out after ${timeoutMs} ms`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timer);
    outer?.removeEventListener("abort", onAbort);
  }
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : "unknown error";
}

async function preflight(
  workspace: NoesisWorkspace,
  steps: readonly PlannedStep[],
  options: RunOptions,
  now: string,
): Promise<{ refusals: string[]; adapters: Map<string, ToolAdapter> }> {
  const refusals: string[] = [];
  const maxSteps = options.maxSteps ?? 8;

  const evaluation = evaluateWarrant(workspace, now);
  if (evaluation.decision !== "allowed") {
    refusals.push(
      `warrant ${evaluation.decision}: ${evaluation.blockers.map((b) => b.code).join(", ")}`,
    );
  }

  if (options.signal?.aborted) refusals.push("operator stop signal is set");

  if (steps.length === 0) refusals.push("no steps planned");
  if (steps.length > maxSteps) {
    refusals.push(`${steps.length} steps exceed the cap of ${maxSteps}`);
  }

  const ids = new Set<string>();
  for (const step of steps) {
    if (ids.has(step.id)) refusals.push(`duplicate step id ${step.id}`);
    ids.add(step.id);
  }

  const adapters = new Map<string, ToolAdapter>();
  for (const adapter of options.adapters) {
    const key = normalizeTool(adapter.tool);
    if (adapters.has(key))
      refusals.push(`two adapters claim "${adapter.tool}"`);
    adapters.set(key, adapter);
  }

  const leaseTools = new Set(workspace.lease.tools.map(normalizeTool));
  const persona = parsePersonaSpec(workspace.persona);
  for (const step of steps) {
    const key = normalizeTool(step.tool);
    if (!leaseTools.has(key)) {
      refusals.push(`step ${step.id}: "${step.tool}" is not on the lease`);
    }
    if (persona.success && !toolPermitted(persona.data, step.tool)) {
      refusals.push(
        `step ${step.id}: ${persona.data.ref} may not use "${step.tool}"`,
      );
    }
    if (!adapters.has(key)) {
      refusals.push(`step ${step.id}: no adapter for "${step.tool}"`);
    }
  }

  if (options.personaTrust) {
    const { envelope, trustedKeyIds } = options.personaTrust;
    if (!persona.success) {
      refusals.push("a signed persona is required but none is attached");
    } else if (!envelope) {
      refusals.push("a signed persona is required but no signature was given");
    } else {
      const check = await verifyEnvelope(envelope, {
        purpose: PERSONA_PURPOSE,
        trustedKeyIds,
      });
      refusals.push(...check.reasons.map((r) => `persona signature: ${r}`));
      const signed = parsePersonaSpec(envelope.payload);
      if (
        !signed.success ||
        personaFingerprint(signed.data) !== personaFingerprint(persona.data)
      ) {
        refusals.push("signed persona does not match the attached persona");
      }
    }
  }

  return { refusals, adapters };
}

export async function runWarranted(
  workspace: NoesisWorkspace,
  steps: readonly PlannedStep[],
  options: RunOptions,
): Promise<RunResult> {
  const clock = options.now ?? (() => new Date().toISOString());
  const startedAt = clock();
  const persona = parsePersonaSpec(workspace.persona);
  const timeoutMs = options.stepTimeoutMs ?? 60_000;

  const records: ExecutionStepRecord[] = await Promise.all(
    steps.map(async (step) => ({
      id: step.id,
      tool: step.tool,
      description: step.description,
      inputDigest: await sha256Canonical(step.input ?? null),
      outputDigest: null,
      status: "not_run" as StepStatus,
      detail: "Not run.",
    })),
  );

  const { refusals, adapters } = await preflight(
    workspace,
    steps,
    options,
    startedAt,
  );

  let outcome: ExecutionOutcome = "refused";
  if (refusals.length === 0) {
    const completed: { index: number; output: StepOutput }[] = [];
    let failed = false;
    // A step that threw may have taken partial effect we cannot undo.
    let unknownEffects = false;

    for (let index = 0; index < steps.length; index += 1) {
      const step = steps[index];
      const record = records[index];
      const adapter = adapters.get(normalizeTool(step.tool))!;

      if (options.signal?.aborted) {
        record.detail = "Operator stop signal received before this step.";
        failed = true;
        break;
      }

      let output: StepOutput;
      try {
        output = await withTimeout(
          (signal) => adapter.execute(step.input, { signal }),
          timeoutMs,
          options.signal,
        );
      } catch (error) {
        record.status = "errored";
        record.detail = `Execute failed: ${message(error)}. Partial effects are unknown.`;
        failed = true;
        unknownEffects = true;
        break;
      }
      record.outputDigest = await sha256Canonical(output);
      completed.push({ index, output });

      let verification: { ok: boolean; detail: string };
      try {
        verification = await withTimeout(
          () => adapter.verify(step.input, output),
          timeoutMs,
          options.signal,
        );
      } catch (error) {
        verification = {
          ok: false,
          detail: `Verify failed: ${message(error)}`,
        };
      }

      if (verification.ok && persona.success && output.text) {
        const lint = lintPersonaOutput(persona.data, output.text);
        if (!lint.ok) {
          verification = {
            ok: false,
            detail: `Output breaks ${persona.data.ref} voice rules: ${[
              ...lint.bannedPhrases,
              ...lint.claimTerms,
              ...(lint.missingRequiredMarker
                ? ["missing required marker"]
                : []),
            ].join(", ")}.`,
          };
        }
      }

      record.status = verification.ok ? "verified" : "verification_failed";
      record.detail = verification.ok
        ? `${output.summary} Verified: ${verification.detail}`
        : verification.detail;
      if (!verification.ok) {
        failed = true;
        break;
      }
    }

    if (!failed) {
      outcome = "executed";
    } else {
      // Undo every step that produced output, newest first.
      let clean = true;
      for (const { index, output } of [...completed].reverse()) {
        const adapter = adapters.get(normalizeTool(steps[index].tool))!;
        const record = records[index];
        if (!adapter.compensate) {
          clean = false;
          record.status = "compensation_failed";
          record.detail = `${record.detail} No compensation is defined; undo manually.`;
          continue;
        }
        try {
          await withTimeout(
            () => adapter.compensate!(steps[index].input, output),
            timeoutMs,
          );
          record.status = "compensated";
          record.detail = `${record.detail} Compensated.`;
        } catch (error) {
          clean = false;
          record.status = "compensation_failed";
          record.detail = `${record.detail} Compensation failed: ${message(error)}`;
        }
      }
      outcome = clean && !unknownEffects ? "rolled_back" : "failed";
    }
  }

  const issuedAt = clock();
  const receipt: ExecutionReceipt = {
    schema: "founderlab.execution-receipt.v1",
    receiptId:
      options.receiptId ??
      `exec-${(await sha256Canonical([workspace.workspaceId, issuedAt])).slice(0, 12)}`,
    workspaceId: workspace.workspaceId,
    issuedAt,
    outcome,
    refusals,
    warrantLevel: workspace.warrantLevel,
    objective: workspace.objective,
    authorityFingerprint: authorityFingerprint(workspace),
    personaRef: persona.success ? persona.data.ref : null,
    personaFingerprint: persona.success
      ? personaFingerprint(persona.data)
      : null,
    lease: {
      scope: workspace.lease.scope,
      tools: [...workspace.lease.tools],
      budget: workspace.lease.budget,
    },
    steps: records,
    residualRisk:
      outcome === "executed"
        ? "All steps executed and verified. The lease is revoked."
        : outcome === "rolled_back"
          ? "A step failed; every completed step was compensated. The lease is revoked."
          : outcome === "failed"
            ? "A step failed and its effects could not all be undone or are unknown. Manual review required."
            : "Nothing executed. The lease is unchanged.",
  };

  const signed = await signPayload(
    receipt,
    EXECUTION_RECEIPT_PURPOSE,
    options.signer,
    issuedAt,
  );

  const next =
    outcome === "refused"
      ? appendAudit(
          workspace,
          {
            kind: "execution_refused",
            message:
              `${receipt.receiptId} refused before execution: ${refusals[0]}`.slice(
                0,
                300,
              ),
          },
          issuedAt,
        )
      : appendAudit(
          { ...workspace, lease: { ...workspace.lease, active: false } },
          {
            kind: "execution_completed",
            message: `${receipt.receiptId} ${outcome}; ${records.filter((r) => r.status === "verified").length}/${records.length} steps verified. Lease revoked.`,
          },
          issuedAt,
        );

  return { workspace: next, receipt: signed };
}

/** Verifies a receipt envelope against trusted signer keys. */
export function verifyExecutionReceipt(
  envelope: SignedEnvelope<ExecutionReceipt>,
  trustedKeyIds: ReadonlySet<string>,
) {
  return verifyEnvelope(envelope, {
    purpose: EXECUTION_RECEIPT_PURPOSE,
    trustedKeyIds,
  });
}

/** Signs a persona so the executor can require a trusted issuer. */
export function signPersona(
  persona: PersonaSpec,
  key: SigningKey,
  signedAt?: string,
) {
  return signPayload(persona, PERSONA_PURPOSE, key, signedAt);
}
