import { fnv1a64 } from "../hash";
import { findClaimTerms } from "./claim-guard";
import type { PersonaSpec } from "./persona-schema";

/**
 * Stylometric signature, ported from LYZT `server/services/stylometric.ts`.
 * LYZT records it per chat turn to detect persona drift and to assert that
 * personas stay distinguishable from each other. Pure and dependency-free.
 */
export type StylometricSignature = {
  avgSentenceLength: number;
  avgWordLength: number;
  questionRatio: number;
  exclamationRatio: number;
  uniqueTokenRatio: number;
  tokenSample: string[];
  sampleDigest: string;
};

const TOKEN_SAMPLE_SIZE = 12;

const STOPWORDS = new Set(
  (
    "the a an and or but if in on at to of for with by is are was were be been " +
    "being have has had do does did will would could should i you he she it we " +
    "they this that these those as from so not no yes me my your our their"
  ).split(" "),
);

function round(value: number, places: number): number {
  return Number(value.toFixed(places));
}

export function computeStylometric(text: string): StylometricSignature {
  const cleaned = String(text ?? "").trim();
  if (!cleaned) {
    return {
      avgSentenceLength: 0,
      avgWordLength: 0,
      questionRatio: 0,
      exclamationRatio: 0,
      uniqueTokenRatio: 0,
      tokenSample: [],
      sampleDigest: "",
    };
  }

  const sentences = cleaned.split(/[.!?]+\s+/).filter((s) => s.trim());
  const words = cleaned.split(/\s+/).filter(Boolean);
  const wordCount = words.length || 1;

  const tokens = words
    .map((word) => word.toLowerCase().replace(/[^a-z0-9'-]/g, ""))
    .filter((word) => word.length >= 3 && !STOPWORDS.has(word));
  const frequency = new Map<string, number>();
  for (const token of tokens) {
    frequency.set(token, (frequency.get(token) ?? 0) + 1);
  }

  return {
    avgSentenceLength: round(
      sentences.length > 0 ? wordCount / sentences.length : wordCount,
      2,
    ),
    avgWordLength: round(
      words.reduce((sum, word) => sum + word.length, 0) / wordCount,
      2,
    ),
    questionRatio: round((cleaned.match(/\?/g) ?? []).length / wordCount, 4),
    exclamationRatio: round((cleaned.match(/!/g) ?? []).length / wordCount, 4),
    uniqueTokenRatio: round(
      tokens.length > 0 ? frequency.size / tokens.length : 0,
      4,
    ),
    tokenSample: [...frequency.entries()]
      .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
      .slice(0, TOKEN_SAMPLE_SIZE)
      .map(([token]) => token),
    sampleDigest: fnv1a64(cleaned.slice(0, 512)),
  };
}

/** Jaccard similarity of two token samples: 1 identical, 0 disjoint. */
export function tokenJaccard(
  a: readonly string[],
  b: readonly string[],
): number {
  if (a.length === 0 && b.length === 0) return 1;
  const left = new Set(a);
  const right = new Set(b);
  let shared = 0;
  for (const token of left) if (right.has(token)) shared += 1;
  return shared / (left.size + right.size - shared);
}

/**
 * Distance between two signatures in [0, 1]. Half comes from bounded shape
 * features, half from vocabulary overlap. 0 means indistinguishable.
 */
export function stylometricDistance(
  a: StylometricSignature,
  b: StylometricSignature,
): number {
  const relative = (x: number, y: number) =>
    x === y ? 0 : Math.abs(x - y) / Math.max(Math.abs(x), Math.abs(y));
  const shape =
    (relative(a.avgSentenceLength, b.avgSentenceLength) +
      relative(a.avgWordLength, b.avgWordLength) +
      relative(a.questionRatio, b.questionRatio) +
      relative(a.exclamationRatio, b.exclamationRatio) +
      relative(a.uniqueTokenRatio, b.uniqueTokenRatio)) /
    5;
  const vocabulary = 1 - tokenJaccard(a.tokenSample, b.tokenSample);
  return round(shape * 0.5 + vocabulary * 0.5, 4);
}

/**
 * Pairs of personas whose sample output is closer than `minDistance`. LYZT
 * runs this as a CI probe so archetypes cannot collapse into one voice.
 */
export function findIndistinctPersonas(
  samples: Readonly<Record<string, string>>,
  minDistance = 0.2,
): { a: string; b: string; distance: number }[] {
  const refs = Object.keys(samples).sort();
  const signatures = new Map(
    refs.map((ref) => [ref, computeStylometric(samples[ref])]),
  );
  const pairs: { a: string; b: string; distance: number }[] = [];
  for (let i = 0; i < refs.length; i += 1) {
    for (let j = i + 1; j < refs.length; j += 1) {
      const distance = stylometricDistance(
        signatures.get(refs[i])!,
        signatures.get(refs[j])!,
      );
      if (distance < minDistance)
        pairs.push({ a: refs[i], b: refs[j], distance });
    }
  }
  return pairs;
}

export type PersonaOutputLint = {
  ok: boolean;
  bannedPhrases: string[];
  claimTerms: string[];
  /** True when the voice requires a marker and none appeared. */
  missingRequiredMarker: boolean;
};

/**
 * Checks drafted output against a persona's machine-checkable voice rules:
 * banned phrases, overclaiming terms, and required markers (for example, the
 * SpellShimmer Oracle must acknowledge uncertainty in every reading).
 */
export function lintPersonaOutput(
  spec: PersonaSpec,
  text: string,
): PersonaOutputLint {
  const lower = text.toLowerCase();
  const bannedPhrases = spec.voice.bannedPhrases.filter((phrase) =>
    lower.includes(phrase.toLowerCase()),
  );
  const claimTerms = findClaimTerms(text);
  const missingRequiredMarker =
    spec.voice.mustIncludeAny.length > 0 &&
    !spec.voice.mustIncludeAny.some((marker) =>
      lower.includes(marker.toLowerCase()),
    );

  return {
    ok:
      bannedPhrases.length === 0 &&
      claimTerms.length === 0 &&
      !missingRequiredMarker,
    bannedPhrases,
    claimTerms,
    missingRequiredMarker,
  };
}
