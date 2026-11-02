import Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it, vi } from "vitest";
import { getExpert } from "../catalog";
import { routeTask } from "../router";
import { createSpendGuard } from "../spend-guard";
import type { Consultation } from "./claude-expert";
import { handleConsult, type ConsultDeps } from "./consult-handler";

const owner = { id: "262467635", email: null, name: "Owner" };
const URL_ = "https://app.example/api/experts/consult";

function request(
  body: unknown,
  headers: Record<string, string> = { "content-type": "application/json" },
) {
  return new Request(URL_, {
    method: "POST",
    headers,
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function consultation(): Consultation {
  const task = "Debug the crash in checkout";
  return {
    route: routeTask(task),
    expert: getExpert("expert:debugger")!,
    brief: null,
    answer: {
      ok: true,
      output: { root_cause: "race" },
      servedBy: "claude-opus-5-5",
      inputTokens: 1,
      outputTokens: 1,
    },
    check: { ok: true, problems: [] },
    review: null,
    vote: {
      personaRef: "role:reviewer",
      verdict: "pass",
      score: 1,
      reason: "Sound.",
      hardVeto: false,
    },
    accepted: true,
    summary: "Debugger answered; Code Reviewer voted pass: Sound.",
  };
}

function deps(overrides: Partial<ConsultDeps> = {}): ConsultDeps {
  return {
    authConfigured: true,
    getPrincipal: async () => owner,
    allowlist: new Set([owner.id]),
    guard: createSpendGuard({ perUserPerHour: 10, globalPerDay: 100 }),
    consult: vi.fn(async () => consultation()),
    ...overrides,
  };
}

async function call(req: Request, d: ConsultDeps) {
  const response = await handleConsult(req, d);
  return { status: response.status, body: await response.json(), response };
}

describe("POST /api/experts/consult gates", () => {
  it("rejects cross-origin requests before reading the session", async () => {
    const getPrincipal = vi.fn(async () => owner);
    const r = await call(
      request(
        { task: "x" },
        {
          "content-type": "application/json",
          origin: "https://evil.example",
        },
      ),
      deps({ getPrincipal }),
    );
    expect(r.status).toBe(403);
    expect(getPrincipal).not.toHaveBeenCalled();
  });

  it("accepts a same-origin request", async () => {
    const r = await call(
      request(
        { task: "Debug the crash in checkout" },
        {
          "content-type": "application/json",
          origin: "https://app.example",
        },
      ),
      deps(),
    );
    expect(r.status).toBe(200);
  });

  it("requires JSON", async () => {
    const r = await call(
      request("task=x", { "content-type": "text/plain" }),
      deps(),
    );
    expect(r.status).toBe(415);
  });

  it("separates unconfigured, anonymous, and not-allowed callers", async () => {
    expect(
      (await call(request({ task: "abc" }), deps({ authConfigured: false })))
        .status,
    ).toBe(503);
    expect(
      (
        await call(
          request({ task: "abc" }),
          deps({ getPrincipal: async () => null }),
        )
      ).status,
    ).toBe(401);
    expect(
      (await call(request({ task: "abc" }), deps({ allowlist: new Set() })))
        .status,
    ).toBe(403);
  });

  it("validates the task and rejects extra fields", async () => {
    for (const body of [
      { task: "x" },
      { task: "a".repeat(4001) },
      { task: "abc", model: "x" },
      "{oops",
    ]) {
      expect((await call(request(body), deps())).status).toBe(400);
    }
  });

  it("enforces the spend limit with Retry-After and never calls Claude", async () => {
    const consult = vi.fn(async () => consultation());
    const d = deps({
      consult,
      guard: createSpendGuard({ perUserPerHour: 1, globalPerDay: 100 }),
    });
    expect((await call(request({ task: "Debug it now" }), d)).status).toBe(200);
    const limited = await call(request({ task: "Debug it again" }), d);
    expect(limited.status).toBe(429);
    expect(limited.response.headers.get("Retry-After")).toBe("3600");
    expect(consult).toHaveBeenCalledTimes(1);
  });

  it("returns only the user-facing fields", async () => {
    const r = await call(
      request({ task: "Debug the crash in checkout" }),
      deps(),
    );
    expect(r.response.headers.get("Cache-Control")).toBe("no-store");
    expect(r.body).toMatchObject({
      accepted: true,
      expert: { ref: "expert:debugger", title: "Debugger" },
      answer: { root_cause: "race" },
      servedBy: "claude-opus-5-5",
      review: { verdict: "pass", reason: "Sound.", score: 1 },
    });
    expect(JSON.stringify(r.body)).not.toContain("system");
  });
});

describe("upstream errors never leak details", () => {
  const cases: [string, Error, number][] = [
    [
      "auth",
      new Anthropic.AuthenticationError(
        401,
        undefined,
        "secret detail sk-ant-xyz",
        new Headers(),
      ),
      503,
    ],
    [
      "rate limit",
      new Anthropic.RateLimitError(
        429,
        undefined,
        "secret detail",
        new Headers(),
      ),
      503,
    ],
    [
      "api",
      new Anthropic.BadRequestError(
        400,
        undefined,
        "secret detail",
        new Headers(),
      ),
      502,
    ],
    ["unexpected", new Error("secret detail"), 500],
  ];

  it.each(cases)(
    "maps %s errors to a generic message",
    async (_name, error, status) => {
      const log = vi.fn();
      const r = await call(
        request({ task: "Debug the crash" }),
        deps({
          consult: async () => {
            throw error;
          },
          log,
        }),
      );
      expect(r.status).toBe(status);
      expect(JSON.stringify(r.body)).not.toContain("secret detail");
      expect(JSON.stringify(log.mock.calls)).not.toContain("secret detail");
    },
  );
});
