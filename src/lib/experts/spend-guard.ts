/**
 * Spending limits for live expert calls, on top of the allowlist.
 *
 * A sliding window per user and a global daily cap. Both are checked and
 * recorded in one step so two concurrent requests cannot both squeeze under
 * a limit.
 *
 * Scope, stated plainly: the counters live in process memory. On a
 * serverless host each warm instance keeps its own counters, so the real
 * ceiling is the limit multiplied by the number of concurrent instances, and
 * a cold start resets them. That is acceptable while the allowlist is a few
 * trusted people; a shared store (for example Redis) is the upgrade before
 * opening access wider.
 */

export type SpendPolicy = {
  perUserPerHour: number;
  globalPerDay: number;
};

export type SpendDecision =
  | { ok: true }
  | {
      ok: false;
      reason: "user_hourly_limit" | "global_daily_limit";
      retryAfterSeconds: number;
    };

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export const DEFAULT_SPEND_POLICY: SpendPolicy = {
  perUserPerHour: 10,
  globalPerDay: 100,
};

function positiveInt(raw: string | undefined, fallback: number): number {
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

export function readSpendPolicy(
  env: Record<string, string | undefined> = process.env,
): SpendPolicy {
  return {
    perUserPerHour: positiveInt(
      env.EXPERT_MAX_PER_USER_PER_HOUR,
      DEFAULT_SPEND_POLICY.perUserPerHour,
    ),
    globalPerDay: positiveInt(
      env.EXPERT_MAX_PER_DAY,
      DEFAULT_SPEND_POLICY.globalPerDay,
    ),
  };
}

export type SpendGuard = {
  tryConsume(userId: string): SpendDecision;
};

export function createSpendGuard(
  policy: SpendPolicy,
  now: () => number = Date.now,
): SpendGuard {
  const perUser = new Map<string, number[]>();
  let global: number[] = [];

  return {
    tryConsume(userId) {
      const t = now();
      global = global.filter((at) => at > t - DAY_MS);
      const mine = (perUser.get(userId) ?? []).filter((at) => at > t - HOUR_MS);

      if (global.length >= policy.globalPerDay) {
        return {
          ok: false,
          reason: "global_daily_limit",
          retryAfterSeconds: Math.ceil((global[0] + DAY_MS - t) / 1000),
        };
      }
      if (mine.length >= policy.perUserPerHour) {
        perUser.set(userId, mine);
        return {
          ok: false,
          reason: "user_hourly_limit",
          retryAfterSeconds: Math.ceil((mine[0] + HOUR_MS - t) / 1000),
        };
      }

      mine.push(t);
      global.push(t);
      perUser.set(userId, mine);
      return { ok: true };
    },
  };
}
