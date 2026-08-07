import { z } from "zod";
import { createInitialProbabilityFlowProtocol } from "./probability-flow";
import {
  probabilityFlowProtocolSchema,
  probabilityFlowReceiptSchema,
} from "./probability-flow-schema";

export const NOESIS_SCHEMA_VERSION = "1.0.0" as const;

export const evidenceStatusSchema = z.enum(["verified", "pending", "failed"]);

export const warrantLevelSchema = z.enum(["low", "medium", "high", "critical"]);

export const evidenceItemSchema = z.strictObject({
  id: z.string().min(3).max(80),
  claim: z.string().min(3).max(240),
  source: z.string().min(2).max(240),
  status: evidenceStatusSchema,
  weight: z.number().int().min(1).max(100),
  independent: z.boolean(),
  observedAt: z.string().datetime(),
});

export const capabilityLeaseSchema = z.strictObject({
  scope: z.string().min(3).max(300),
  tools: z.array(z.string().min(1).max(80)).min(1).max(12),
  active: z.boolean(),
  budget: z.string().min(3).max(160),
  expiresAt: z.string().datetime().nullable(),
  approvalRequired: z.boolean(),
  approvalGranted: z.boolean(),
});

export const auditEventSchema = z.strictObject({
  id: z.string().min(3).max(80),
  at: z.string().datetime(),
  kind: z.enum([
    "workspace_created",
    "workspace_updated",
    "evidence_added",
    "evidence_removed",
    "lease_changed",
    "workspace_imported",
    "probability_flow_resolved",
    "receipt_issued",
  ]),
  message: z.string().min(3).max(300),
});

export const receiptSchema = z.strictObject({
  schemaVersion: z.literal(NOESIS_SCHEMA_VERSION),
  receiptId: z.string().min(3).max(80),
  workspaceId: z.string().min(3).max(80),
  issuedAt: z.string().datetime(),
  decision: z.literal("allowed"),
  result: z.literal("dry_run_completed"),
  warrantLevel: warrantLevelSchema,
  objective: z.string().min(3).max(600),
  canonicalState: z.string().min(3).max(1200),
  canonicalStateRevision: z.string().datetime(),
  coverage: z.number().min(0).max(1),
  uncertainty: z.number().min(0).max(1),
  verifiedEvidenceIds: z.array(z.string().min(3).max(80)).min(1),
  independentVerification: z.boolean(),
  lease: capabilityLeaseSchema,
  probabilityFlowReceipt: probabilityFlowReceiptSchema.optional(),
  residualRisk: z.string().min(3).max(400),
});

export const noesisWorkspaceSchema = z
  .strictObject({
    schemaVersion: z.literal(NOESIS_SCHEMA_VERSION),
    workspaceId: z.string().min(3).max(80),
    title: z.string().min(3).max(120),
    objective: z.string().min(3).max(600),
    canonicalState: z.string().min(3).max(1200),
    uncertainty: z.number().min(0).max(1),
    warrantLevel: warrantLevelSchema,
    blocker: z.string().min(3).max(500),
    recursionOpen: z.boolean(),
    recursionDepth: z.number().int().min(0).max(5),
    evidence: z.array(evidenceItemSchema).max(40),
    lease: capabilityLeaseSchema,
    probabilityFlow: probabilityFlowProtocolSchema.optional(),
    audit: z.array(auditEventSchema).max(200),
    receipts: z.array(receiptSchema).max(25),
    updatedAt: z.string().datetime(),
  })
  .transform((workspace) => ({
    ...workspace,
    probabilityFlow:
      workspace.probabilityFlow ??
      createInitialProbabilityFlowProtocol(workspace.updatedAt),
  }));

export type EvidenceStatus = z.infer<typeof evidenceStatusSchema>;
export type WarrantLevel = z.infer<typeof warrantLevelSchema>;
export type EvidenceItem = z.infer<typeof evidenceItemSchema>;
export type CapabilityLease = z.infer<typeof capabilityLeaseSchema>;
export type AuditEvent = z.infer<typeof auditEventSchema>;
export type NoesisReceipt = z.infer<typeof receiptSchema>;
export type NoesisWorkspace = z.infer<typeof noesisWorkspaceSchema>;

export type WorkspaceParseResult =
  | { success: true; data: NoesisWorkspace }
  | { success: false; error: string };

export function parseNoesisWorkspace(value: unknown): WorkspaceParseResult {
  const result = noesisWorkspaceSchema.safeParse(value);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const error = result.error.issues
    .slice(0, 5)
    .map((issue) => {
      const path = issue.path.join(".") || "workspace";
      return `${path}: ${issue.message}`;
    })
    .join("; ");

  return { success: false, error };
}
