import { z } from "zod";
import {
  createInitialNoesisWorkspace,
  createNoesisId,
  evaluateWarrant,
} from "../noesis";

const text = (max: number) => z.string().trim().min(1).max(max);
const money = z.number().finite().min(0).max(1_000_000_000);
export const safeUrl = z.union([
  z.literal(""),
  z
    .string()
    .max(2000)
    .url()
    .refine((url) => {
      try {
        return ["http:", "https:"].includes(new URL(url).protocol);
      } catch {
        return false;
      }
    }, "Use an http or https URL"),
]);
export const evidenceSchema = z.strictObject({
  id: text(80),
  category: z.enum([
    "Ownership",
    "Permitted use",
    "Condition",
    "Financials",
    "Fees",
  ]),
  claim: text(600),
  source: text(240),
  url: safeUrl,
  status: z.enum(["unreviewed", "reviewed", "contradicted"]),
  observedAt: z.string().datetime(),
});
export const assetSchema = z.strictObject({
  id: text(80),
  name: text(120),
  location: text(160),
  type: z.enum(["Condo", "House", "Multifamily", "Other"]),
  price: money,
  monthlyRent: money,
  monthlyExpenses: money,
  occupancy: z.number().min(0).max(100),
  closingCosts: money,
  annualDebtService: money,
  sourceUrl: safeUrl,
  description: z.string().max(2000),
  sample: z.boolean(),
  shortlisted: z.boolean(),
  revision: z.number().int().min(1),
  evidence: z.array(evidenceSchema).max(40),
});
export const mandateSchema = z.strictObject({
  objective: text(600),
  location: z.string().max(160),
  budget: money,
  intendedUse: z.enum([
    "Personal + rental",
    "Long-term rental",
    "Personal use",
  ]),
  revision: z.number().int().min(1),
});
const eventSchema = z.strictObject({
  id: text(80),
  at: z.string().datetime(),
  message: text(500),
});
const approvalSchema = z.strictObject({
  assetId: text(80),
  assetRevision: z.number().int().min(1),
  mandateRevision: z.number().int().min(1),
  at: z.string().datetime(),
  action: z.literal("prepare_review_packet"),
});
export const workspaceSchema = z
  .strictObject({
    version: z.literal(1),
    name: text(120),
    mandate: mandateSchema,
    assets: z.array(assetSchema).max(100),
    events: z.array(eventSchema).max(250),
    approvals: z.array(approvalSchema).max(100),
  })
  .superRefine((workspace, ctx) => {
    if (
      new Set(workspace.assets.map((a) => a.id)).size !==
      workspace.assets.length
    )
      ctx.addIssue({ code: "custom", message: "Duplicate asset IDs" });
    if (
      workspace.assets.some(
        (a) => new Set(a.evidence.map((e) => e.id)).size !== a.evidence.length,
      )
    )
      ctx.addIssue({ code: "custom", message: "Duplicate evidence IDs" });
    if (
      workspace.approvals.some(
        (a) => !workspace.assets.some((asset) => asset.id === a.assetId),
      )
    )
      ctx.addIssue({
        code: "custom",
        message: "Approval references a missing asset",
      });
  });
export type Asset = z.infer<typeof assetSchema>;
export type Evidence = z.infer<typeof evidenceSchema>;
export type Mandate = z.infer<typeof mandateSchema>;
export type Workspace = z.infer<typeof workspaceSchema>;

export const categories = [
  "Ownership",
  "Permitted use",
  "Condition",
  "Financials",
  "Fees",
] as const;
export const currency = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
export const percent = (amount: number | null) =>
  amount === null ? "—" : `${amount.toFixed(1)}%`;

export function createWorkspace(): Workspace {
  return {
    version: 1,
    name: "My acquisition workspace",
    mandate: {
      objective:
        "Find a property for personal use and rental income, with clear costs and documented permitted use.",
      location: "Chicago, IL",
      budget: 650000,
      intendedUse: "Personal + rental",
      revision: 1,
    },
    assets: [
      {
        id: "sample-loft",
        name: "West Loop loft",
        location: "Chicago, IL",
        type: "Condo",
        price: 485000,
        monthlyRent: 3400,
        monthlyExpenses: 1120,
        occupancy: 92,
        closingCosts: 14550,
        annualDebtService: 0,
        sourceUrl: "",
        description:
          "Illustrative two-bedroom loft. Rental income, costs, and availability are sample assumptions. No actual listing or verified rental permission.",
        sample: true,
        shortlisted: true,
        revision: 1,
        evidence: [],
      },
      {
        id: "sample-house",
        name: "Lakeside retreat",
        location: "New Buffalo, MI",
        type: "House",
        price: 595000,
        monthlyRent: 5300,
        monthlyExpenses: 1750,
        occupancy: 70,
        closingCosts: 17850,
        annualDebtService: 0,
        sourceUrl: "",
        description:
          "Illustrative three-bedroom seasonal home. Figures are examples for scenario planning. Confirm local rental rules, seasonal demand, and operating costs.",
        sample: true,
        shortlisted: false,
        revision: 1,
        evidence: [],
      },
      {
        id: "sample-duplex",
        name: "Neighborhood duplex",
        location: "Chicago, IL",
        type: "Multifamily",
        price: 625000,
        monthlyRent: 4800,
        monthlyExpenses: 1580,
        occupancy: 95,
        closingCosts: 18750,
        annualDebtService: 0,
        sourceUrl: "",
        description:
          "Illustrative two-unit building. Figures do not include financing unless entered. An inspection, title review, leases, and expense statements are still needed.",
        sample: true,
        shortlisted: false,
        revision: 1,
        evidence: [],
      },
    ],
    events: [],
    approvals: [],
  };
}

export function parseWorkspace(value: unknown): Workspace {
  return workspaceSchema.parse(value);
}
export function importWorkspace(value: unknown): Workspace {
  // A portable file never grants authority. Require new approval in this session.
  return { ...parseWorkspace(value), approvals: [] };
}
export function logEvent(workspace: Workspace, message: string): Workspace {
  return {
    ...workspace,
    events: [
      { id: createNoesisId("event"), at: new Date().toISOString(), message },
      ...workspace.events,
    ].slice(0, 250),
  };
}
export function updateAsset(workspace: Workspace, asset: Asset): Workspace {
  const existing = workspace.assets.find((a) => a.id === asset.id);
  if (!existing) throw new Error("Asset not found");
  const valid = assetSchema.parse({
    ...asset,
    revision: existing.revision + 1,
  });
  return logEvent(
    {
      ...workspace,
      assets: workspace.assets.map((a) => (a.id === asset.id ? valid : a)),
      approvals: workspace.approvals.filter((a) => a.assetId !== asset.id),
    },
    `${asset.name}: dossier updated; previous packet approval cleared.`,
  );
}
export function updateMandate(
  workspace: Workspace,
  mandate: Mandate,
): Workspace {
  return logEvent(
    {
      ...workspace,
      mandate: mandateSchema.parse({
        ...mandate,
        revision: workspace.mandate.revision + 1,
      }),
      approvals: [],
    },
    "Mandate updated; previous packet approvals cleared.",
  );
}
export function economics(asset: Asset, occupancy = asset.occupancy) {
  assetSchema.parse(asset);
  if (!Number.isFinite(occupancy) || occupancy < 0 || occupancy > 100)
    throw new Error("Occupancy must be between 0 and 100");
  const gross = (asset.monthlyRent * 12 * occupancy) / 100;
  const expenses = asset.monthlyExpenses * 12;
  const noi = gross - expenses;
  return {
    gross,
    expenses,
    noi,
    cashFlow: noi - asset.annualDebtService,
    capRate: asset.price > 0 ? (noi / asset.price) * 100 : null,
    acquisition: asset.price + asset.closingCosts,
  };
}
export function diligence(asset: Asset) {
  return categories.map((category) => ({
    category,
    reviewed: asset.evidence.some(
      (e) => e.category === category && e.status === "reviewed",
    ),
    contradicted: asset.evidence.some(
      (e) => e.category === category && e.status === "contradicted",
    ),
  }));
}
export function packetApprovalValid(workspace: Workspace, asset: Asset) {
  return workspace.approvals.some(
    (a) =>
      a.assetId === asset.id &&
      a.assetRevision === asset.revision &&
      a.mandateRevision === workspace.mandate.revision,
  );
}
export function researchWarrant(workspace: Workspace, asset: Asset) {
  const noesis = createInitialNoesisWorkspace();
  noesis.title = "Prepare asset review packet";
  noesis.objective = workspace.mandate.objective;
  noesis.canonicalState = `Asset ${asset.id} revision ${asset.revision}; mandate revision ${workspace.mandate.revision}. User-entered facts; no external validation.`;
  noesis.warrantLevel = "low";
  noesis.uncertainty = 0;
  noesis.evidence = [
    {
      id: "schema-check",
      claim: "Asset inputs satisfy the bounded schema",
      source: "assetSchema.safeParse",
      status: assetSchema.safeParse(asset).success ? "verified" : "failed",
      weight: 100,
      independent: false,
      observedAt: new Date().toISOString(),
    },
  ];
  noesis.lease = {
    scope: "Prepare a local review packet only",
    tools: ["local calculation", "file export"],
    active: packetApprovalValid(workspace, asset),
    budget: "One local packet; zero external effects",
    expiresAt: null,
    approvalRequired: true,
    approvalGranted: packetApprovalValid(workspace, asset),
  };
  return evaluateWarrant(noesis);
}
export function approvePacket(workspace: Workspace, asset: Asset): Workspace {
  if (
    !workspace.assets.some(
      (a) => a.id === asset.id && a.revision === asset.revision,
    )
  )
    throw new Error("Asset changed; review again");
  return logEvent(
    {
      ...workspace,
      approvals: [
        ...workspace.approvals.filter((a) => a.assetId !== asset.id),
        {
          assetId: asset.id,
          assetRevision: asset.revision,
          mandateRevision: workspace.mandate.revision,
          at: new Date().toISOString(),
          action: "prepare_review_packet",
        },
      ],
    },
    `Approved local packet preparation for ${asset.name}, revision ${asset.revision}. No contact, offer, signature, or payment authorized.`,
  );
}
export function reviewPacket(workspace: Workspace, asset: Asset): string {
  if (researchWarrant(workspace, asset).decision !== "allowed")
    throw new Error("Approve this revision before preparing a packet");
  const base = economics(asset);
  const stress = economics(asset, Math.max(0, asset.occupancy - 15));
  return [
    `# TrueNorth Exchange — ${asset.name}`,
    `Prepared: ${new Date().toISOString()}`,
    `Asset revision: ${asset.revision}; mandate revision: ${workspace.mandate.revision}`,
    asset.sample
      ? "ILLUSTRATIVE SAMPLE — not a live listing."
      : "USER-ENTERED ASSET — not independently verified.",
    "## Mandate",
    workspace.mandate.objective,
    `Budget: ${currency(workspace.mandate.budget)}. Intended use: ${workspace.mandate.intendedUse}.`,
    "## Asset",
    `${asset.location} · ${asset.type}`,
    asset.description,
    `Listing source: ${asset.sourceUrl || "Not supplied"}`,
    "## Assumptions and scenarios",
    `Purchase price: ${currency(asset.price)}`,
    `Closing costs: ${currency(asset.closingCosts)}`,
    `Monthly full-occupancy rent: ${currency(asset.monthlyRent)}`,
    `Occupancy: ${asset.occupancy}%`,
    `Monthly operating expenses: ${currency(asset.monthlyExpenses)}`,
    `Annual debt service: ${currency(asset.annualDebtService)}`,
    `Annual net operating income: ${currency(base.noi)}`,
    `Unlevered cap rate: ${percent(base.capRate)}`,
    `Cash flow after entered debt service: ${currency(base.cashFlow)}`,
    `Downside NOI at ${Math.max(0, asset.occupancy - 15)}% occupancy: ${currency(stress.noi)}`,
    "These are calculations from user inputs, not forecasts or appraisals. Include taxes, insurance, maintenance, reserves and management in expense assumptions. Income taxes and selling costs are excluded.",
    "## Evidence",
    ...asset.evidence.map(
      (e) =>
        `- [${e.status}; user recorded] ${e.category}: ${e.claim}\n  Source: ${e.source} ${e.url}\n  Observed: ${e.observedAt}`,
    ),
    ...(asset.evidence.length ? [] : ["No supporting evidence recorded."]),
    "## Open questions",
    ...diligence(asset)
      .filter((d) => !d.reviewed || d.contradicted)
      .map(
        (d) =>
          `- ${d.category}: ${d.contradicted ? "resolve contradictory evidence" : "obtain and review supporting records"}`,
      ),
    "## Authority and completion",
    "Local preparation only. No professional review, outreach, offer, contract execution, funds movement or title transfer has occurred. Source records and professional conclusions must be verified separately.",
  ].join("\n\n");
}
