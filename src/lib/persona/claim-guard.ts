/**
 * Public-language claim guard for persona names, missions, governing laws, and
 * drafted output. Ported from LYZT-AI `shared/agent-name-guard.ts` with one
 * correction: LYZT matched raw substrings, so "agi" rejected ordinary words
 * such as "managing" and "agile". This guard matches whole words only.
 *
 * It is a lint for overclaiming, not a safety classifier. It also flags
 * negated uses ("not guaranteed"); rephrase rather than special-case them.
 */
export const BANNED_CLAIM_TERMS: readonly string[] = [
  "agi",
  "artificial general intelligence",
  "superintelligence",
  "superintelligent",
  "sentient",
  "sentience",
  "conscious",
  "consciousness",
  "self-aware",
  "100% accurate",
  "guaranteed",
  "infallible",
  "never wrong",
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const TERM_PATTERNS = BANNED_CLAIM_TERMS.map((term) => ({
  term,
  pattern: new RegExp(`(^|[^a-z0-9])${escapeRegExp(term)}(?=$|[^a-z0-9])`, "i"),
}));

/** Every banned claim term present in `text`, in catalog order. */
export function findClaimTerms(text: string): string[] {
  return TERM_PATTERNS.filter(({ pattern }) => pattern.test(text)).map(
    ({ term }) => term,
  );
}

/** First banned claim term in `text`, or null when it is clean. */
export function bannedClaimTerm(text: string): string | null {
  return findClaimTerms(text)[0] ?? null;
}
