import { z } from "zod";
import { personaRefSchema } from "../persona/persona-schema";

/**
 * An expert is a task contract layered on a governed persona.
 *
 * Character apps give a model a name and a voice. An expert adds what makes
 * the answer useful and checkable: when to route to it, how it works, the
 * exact deliverable it must return, the rubric a reviewer grades it on, how
 * hard Claude should think, and which second expert reviews it. Authority
 * (ceiling, tools, forbidden actions) always comes from the persona.
 */

export const effortSchema = z.enum(["low", "medium", "high", "xhigh"]);
export type Effort = z.infer<typeof effortSchema>;

export const EFFORT_ORDER: readonly Effort[] = [
  "low",
  "medium",
  "high",
  "xhigh",
];

const sectionIdSchema = z
  .string()
  .regex(/^[a-z][a-z0-9_]*$/, "Section ids are snake_case.")
  .max(40);

export const expertSpecSchema = z
  .strictObject({
    ref: z
      .string()
      .regex(
        /^expert:[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Expert refs look like expert:slug.",
      ),
    title: z.string().trim().min(3).max(60),
    /** What the user gets, in one line. */
    promise: z.string().trim().min(10).max(160),
    /** Persona that bounds this expert's authority and voice. */
    personaRef: personaRefSchema,
    /** Routing signals: lowercase words or phrases with a weight. */
    signals: z
      .array(
        z.strictObject({
          term: z.string().trim().toLowerCase().min(2).max(40),
          weight: z.number().min(0.5).max(5),
        }),
      )
      .min(3)
      .max(40),
    /** How the expert approaches the work. Guidance, not a script. */
    method: z.array(z.string().trim().min(5).max(200)).min(2).max(8),
    /** The deliverable: every section must be present and non-empty. */
    deliverable: z
      .array(
        z.strictObject({
          id: sectionIdSchema,
          label: z.string().trim().min(2).max(60),
          guidance: z.string().trim().min(5).max(200),
        }),
      )
      .min(2)
      .max(8),
    /** Checks a reviewer grades the deliverable against. */
    rubric: z.array(z.string().trim().min(5).max(200)).min(2).max(8),
    /** Default effort; the router may raise it for risky or complex tasks. */
    effort: effortSchema,
    /** A different expert that reviews this one's work. */
    reviewerRef: z.string().regex(/^expert:[a-z0-9-]+$/),
  })
  .superRefine((spec, ctx) => {
    if (spec.reviewerRef === spec.ref) {
      ctx.addIssue({
        code: "custom",
        path: ["reviewerRef"],
        message: "An expert cannot review its own work.",
      });
    }
    const ids = spec.deliverable.map((s) => s.id);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({
        code: "custom",
        path: ["deliverable"],
        message: "Deliverable section ids must be unique.",
      });
    }
    const terms = spec.signals.map((s) => s.term);
    if (new Set(terms).size !== terms.length) {
      ctx.addIssue({
        code: "custom",
        path: ["signals"],
        message: "Routing signals must be unique.",
      });
    }
  });

export type ExpertSpec = z.infer<typeof expertSpecSchema>;
