import { describe, expect, it } from "vitest";
import {
  createSpendGuard,
  DEFAULT_SPEND_POLICY,
  readSpendPolicy,
} from "./spend-guard";

describe("spend guard", () => {
  it("limits each user per hour and frees the slot after the window", () => {
    let t = 0;
    const guard = createSpendGuard(
      { perUserPerHour: 2, globalPerDay: 100 },
      () => t,
    );
    expect(guard.tryConsume("a").ok).toBe(true);
    expect(guard.tryConsume("a").ok).toBe(true);
    const blocked = guard.tryConsume("a");
    expect(blocked).toMatchObject({ ok: false, reason: "user_hourly_limit" });
    expect(blocked.ok === false && blocked.retryAfterSeconds).toBe(3600);
    // Other users are unaffected.
    expect(guard.tryConsume("b").ok).toBe(true);
    t = 60 * 60 * 1000 + 1;
    expect(guard.tryConsume("a").ok).toBe(true);
  });

  it("caps the whole deployment per day", () => {
    let t = 0;
    const guard = createSpendGuard(
      { perUserPerHour: 100, globalPerDay: 3 },
      () => t,
    );
    for (const user of ["a", "b", "c"])
      expect(guard.tryConsume(user).ok).toBe(true);
    expect(guard.tryConsume("d")).toMatchObject({
      ok: false,
      reason: "global_daily_limit",
    });
    t = 24 * 60 * 60 * 1000 + 1;
    expect(guard.tryConsume("d").ok).toBe(true);
  });

  it("does not record a blocked attempt against the user", () => {
    let t = 0;
    const guard = createSpendGuard(
      { perUserPerHour: 1, globalPerDay: 100 },
      () => t,
    );
    guard.tryConsume("a");
    t = 30 * 60 * 1000;
    guard.tryConsume("a"); // blocked, must not extend the window
    t = 60 * 60 * 1000 + 1;
    expect(guard.tryConsume("a").ok).toBe(true);
  });

  it("reads positive integer limits from the environment, else defaults", () => {
    expect(
      readSpendPolicy({
        EXPERT_MAX_PER_USER_PER_HOUR: "3",
        EXPERT_MAX_PER_DAY: "20",
      }),
    ).toEqual({ perUserPerHour: 3, globalPerDay: 20 });
    expect(
      readSpendPolicy({
        EXPERT_MAX_PER_USER_PER_HOUR: "-1",
        EXPERT_MAX_PER_DAY: "x",
      }),
    ).toEqual(DEFAULT_SPEND_POLICY);
  });
});
