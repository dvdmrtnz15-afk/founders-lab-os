import { execFile } from "node:child_process";
import type { StepOutput, ToolAdapter } from "../executor";

/**
 * Server-side adapter that runs one fixed command. Node only: never import it
 * from client components.
 *
 * Safety properties:
 * - No shell. `execFile` passes arguments directly, so a step cannot inject
 *   shell syntax.
 * - Fixed argv. The step input must be `{}`; callers cannot add arguments.
 * - Minimal environment. Only PATH (and HOME, for tool caches) is passed, so
 *   secrets in the host environment never reach the child process.
 * - Bounded. Timeout from the executor signal plus a hard output cap.
 */
export type CommandAdapterConfig = {
  tool: string;
  command: string;
  args: readonly string[];
  cwd: string;
  /**
   * Declare the command free of side effects (tests, lint, type checks). Only
   * then does rollback treat it as needing no compensation.
   */
  readOnly: boolean;
  /** Hard kill after this many ms even without an executor signal. */
  timeoutMs?: number;
  /** Bytes of stdout/stderr kept for the summary. Default 2,000. */
  tailBytes?: number;
};

type CommandResult = { exitCode: number; tail: string };

function tail(text: string, bytes: number): string {
  return text.length <= bytes ? text : text.slice(-bytes);
}

export function createCommandAdapter(
  config: CommandAdapterConfig,
): ToolAdapter {
  const label = [config.command, ...config.args].join(" ");
  const tailBytes = config.tailBytes ?? 2_000;

  return {
    tool: config.tool,
    describe: () => `Runs \`${label}\` in ${config.cwd} with no shell.`,

    execute(input, { signal }): Promise<StepOutput> {
      if (
        input !== undefined &&
        input !== null &&
        (typeof input !== "object" || Object.keys(input).length > 0)
      ) {
        return Promise.reject(
          new Error("Command adapters take no input; arguments are fixed."),
        );
      }

      return new Promise((resolve, reject) => {
        execFile(
          config.command,
          [...config.args],
          {
            cwd: config.cwd,
            // Deliberately not the host environment: only PATH and HOME.
            // Next's types require NODE_ENV, which is not forwarded.
            env: {
              PATH: process.env.PATH ?? "",
              HOME: process.env.HOME ?? "",
            } as unknown as NodeJS.ProcessEnv,
            signal,
            timeout: config.timeoutMs ?? 120_000,
            maxBuffer: 8 * 1024 * 1024,
            windowsHide: true,
          },
          (error, stdout, stderr) => {
            if (error && (error.name === "AbortError" || error.killed)) {
              reject(new Error(`\`${label}\` was stopped before it finished.`));
              return;
            }
            const exitCode =
              error && typeof error.code === "number"
                ? error.code
                : error
                  ? 1
                  : 0;
            const data: CommandResult = {
              exitCode,
              tail: tail(`${stdout}${stderr}`, tailBytes),
            };
            resolve({ summary: `\`${label}\` exited ${exitCode}.`, data });
          },
        );
      });
    },

    async verify(_input, output) {
      const result = output.data as CommandResult | undefined;
      return result?.exitCode === 0
        ? { ok: true, detail: "exit code 0" }
        : {
            ok: false,
            detail: `\`${label}\` exited ${result?.exitCode ?? "unknown"}: ${result?.tail.trim().split("\n").slice(-3).join(" | ") ?? ""}`,
          };
    },
    // A command with side effects defines no compensation, so a failed run
    // after it is reported as needing manual review.
    ...(config.readOnly ? { compensate: async () => undefined } : {}),
  };
}
