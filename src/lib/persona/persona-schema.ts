import { z } from "zod";
import { warrantLevelSchema } from "../warrant-level";
import { bannedClaimTerm } from "./claim-guard";

export const PERSONA_SCHEMA_VERSION = "1.0.0" as const;

/** `namespace:slug`, for example `role:reviewer` or `brand:spellshimmer-oracle`. */
export const personaRefSchema = z
  .string()
  .max(80)
  .regex(
    /^[a-z]+:[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Persona refs look like namespace:kebab-slug.",
  );

const actionIdSchema = z
  .string()
  .max(64)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Action ids are kebab-case.");

/** Tool names follow the free-text lease vocabulary ("read workspace"). */
const toolSchema = z.string().trim().min(1).max(80);

const shortLine = z.string().trim().min(2).max(160);

/**
 * One human-readable trait axis. LYZT compiles 144-dimension trait vectors
 * down to three axes for display; this substrate stores only the compiled
 * axes, because raw vectors add weight without adding enforceable meaning.
 */
export const traitAxisSchema = z.strictObject({
  adjective: z.string().trim().min(2).max(60),
  level: z.number().min(0).max(1),
});

/**
 * Voice rules use the do / avoid / spark polarity from the LYZT cinema brand
 * voice (the SpellShimmer surface). `bannedPhrases` and `mustIncludeAny` are
 * the machine-checkable subset used by `lintPersonaOutput`.
 */
export const personaVoiceSchema = z.strictObject({
  do: z.array(shortLine).max(8),
  avoid: z.array(shortLine).max(8),
  spark: z.array(shortLine).max(8),
  bannedPhrases: z.array(z.string().trim().min(2).max(60)).max(24),
  mustIncludeAny: z.array(z.string().trim().min(2).max(60)).max(12),
});

function normalizeTool(tool: string): string {
  return tool.trim().toLowerCase().replace(/\s+/g, " ");
}

function duplicates(values: readonly string[], normalize = (v: string) => v) {
  const seen = new Set<string>();
  const repeated = new Set<string>();
  for (const value of values) {
    const key = normalize(value);
    if (seen.has(key)) repeated.add(value);
    seen.add(key);
  }
  return [...repeated];
}

export const personaSpecSchema = z
  .strictObject({
    schemaVersion: z.literal(PERSONA_SCHEMA_VERSION),
    ref: personaRefSchema,
    /** Strictly increases on every published revision of the same ref. */
    version: z.number().int().min(1).max(1_000_000),
    displayName: z.string().trim().min(2).max(60),
    mission: z.string().trim().min(10).max(400),
    axes: z.strictObject({
      style: traitAxisSchema,
      decision: traitAxisSchema,
      social: traitAxisSchema,
    }),
    voice: personaVoiceSchema,
    /** The single most important boundary, in one plain sentence. */
    governingLaw: z.string().trim().min(10).max(200),
    forbiddenActions: z.array(actionIdSchema).max(32),
    /** Highest warrant tier this persona may act under. */
    riskCeiling: warrantLevelSchema,
    /** Tier at which a bound human approval becomes mandatory; null = never. */
    escalateAtOrAbove: warrantLevelSchema.nullable(),
    /** Lease tools this persona may hold. `["*"]` allows any unblocked tool. */
    allowedTools: z.array(toolSchema).min(1).max(24),
    blockedTools: z.array(toolSchema).max(24),
    /** Persona this one was derived from; it may never exceed the parent. */
    parentRef: personaRefSchema.nullable(),
  })
  .superRefine((spec, ctx) => {
    for (const field of ["displayName", "mission", "governingLaw"] as const) {
      const term = bannedClaimTerm(spec[field]);
      if (term) {
        ctx.addIssue({
          code: "custom",
          path: [field],
          message: `Overclaiming term "${term}" is not allowed.`,
        });
      }
    }

    if (spec.allowedTools.includes("*") && spec.allowedTools.length > 1) {
      ctx.addIssue({
        code: "custom",
        path: ["allowedTools"],
        message: 'The "*" wildcard must be the only allowed tool.',
      });
    }

    if (spec.blockedTools.includes("*")) {
      ctx.addIssue({
        code: "custom",
        path: ["blockedTools"],
        message:
          'Blocking "*" leaves no usable tool; lower the ceiling instead.',
      });
    }

    const blocked = new Set(spec.blockedTools.map(normalizeTool));
    for (const tool of spec.allowedTools) {
      if (blocked.has(normalizeTool(tool))) {
        ctx.addIssue({
          code: "custom",
          path: ["allowedTools"],
          message: `"${tool}" is both allowed and blocked.`,
        });
      }
    }

    const listChecks = [
      ["allowedTools", duplicates(spec.allowedTools, normalizeTool)],
      ["blockedTools", duplicates(spec.blockedTools, normalizeTool)],
      ["forbiddenActions", duplicates(spec.forbiddenActions)],
    ] as const;
    for (const [path, repeated] of listChecks) {
      if (repeated.length > 0) {
        ctx.addIssue({
          code: "custom",
          path: [path],
          message: `Duplicate entries: ${repeated.join(", ")}.`,
        });
      }
    }

    if (spec.parentRef === spec.ref) {
      ctx.addIssue({
        code: "custom",
        path: ["parentRef"],
        message: "A persona cannot be its own parent.",
      });
    }
  });

export type PersonaSpec = z.infer<typeof personaSpecSchema>;
export type PersonaVoice = z.infer<typeof personaVoiceSchema>;
export type TraitAxis = z.infer<typeof traitAxisSchema>;

export { normalizeTool };

export type PersonaParseResult =
  | { success: true; data: PersonaSpec }
  | { success: false; error: string };

export function parsePersonaSpec(value: unknown): PersonaParseResult {
  const result = personaSpecSchema.safeParse(value);
  if (result.success) return { success: true, data: result.data };

  return {
    success: false,
    error: result.error.issues
      .slice(0, 5)
      .map((issue) => `${issue.path.join(".") || "persona"}: ${issue.message}`)
      .join("; "),
  };
}
