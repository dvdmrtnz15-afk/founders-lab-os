import { z } from "zod";

/**
 * Warrant tiers shared by the Noesis kernel and the persona substrate. Lives in
 * its own module so persona and workspace schemas can both import it without
 * an import cycle.
 */
export const warrantLevelSchema = z.enum(["low", "medium", "high", "critical"]);

export type WarrantLevel = z.infer<typeof warrantLevelSchema>;

export const WARRANT_LEVEL_ORDER: readonly WarrantLevel[] = [
  "low",
  "medium",
  "high",
  "critical",
];

/** Position of a tier in the lattice; lower is less consequential. */
export function warrantRank(level: WarrantLevel): number {
  return WARRANT_LEVEL_ORDER.indexOf(level);
}

export function minWarrantLevel(
  a: WarrantLevel,
  b: WarrantLevel,
): WarrantLevel {
  return warrantRank(a) <= warrantRank(b) ? a : b;
}
