const agentModes = [
  {
    name: "Plan",
    model: "gemma4:e4b",
    scope: "Shape the task, pick files, define checks",
  },
  {
    name: "Code",
    model: "qwen3.6:27b",
    scope: "Hard repo reasoning and implementation paths",
  },
  {
    name: "Copilot",
    model: "GitHub cloud",
    scope: "Inline completions while editing in VS Code",
  },
  {
    name: "PR",
    model: "GitHub",
    scope: "Issues, branches, pull requests, and reviews",
  },
];

const workspaceSignals = [
  ["Repo", "founders-lab-os"],
  ["Branch", "local"],
  ["Models", "frontier local"],
  ["Prod", "locked"],
];

const contextPills = [
  "Current file",
  "Selected folder",
  "Git diff",
  "Terminal",
  "Founder memory",
  "GitHub issue",
];

const commandQueue = [
  {
    title: "Draft implementation plan",
    meta: "Plan mode -> local model",
    status: "ready",
  },
  {
    title: "Patch files with one editor",
    meta: "Code mode -> governed edit",
    status: "gated",
  },
  {
    title: "Run checks and summarize",
    meta: "Terminal -> format, lint, build",
    status: "ready",
  },
  {
    title: "Open PR checkpoint",
    meta: "GitHub -> manual approval",
    status: "manual",
  },
];

const routingRules = [
  ["Composer default", "gemma4:e4b"],
  ["Deep repo reasoning", "qwen3.6:27b"],
  ["Fast code help", "qwen2.5-coder:7b"],
  ["Inline completion", "GitHub Copilot"],
  ["Private embeddings", "nomic-embed-text"],
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f4f2ec] text-zinc-950">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-5 sm:px-8 lg:px-10">
        <header className="grid gap-4 border-b border-zinc-300 pb-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-teal-700">
              Founders Lab OS
            </p>
            <h1 className="mt-2 text-3xl font-semibold leading-tight text-zinc-950 sm:text-4xl">
              VS Code meets Codex for founder build loops.
            </h1>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[34rem]">
            {workspaceSignals.map(([label, value]) => (
              <div
                className="rounded-md border border-zinc-300 bg-white px-3 py-3 shadow-sm"
                key={label}
              >
                <p className="text-xs uppercase text-zinc-500">{label}</p>
                <p className="mt-1 truncate font-semibold text-zinc-950">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </header>

        <section className="grid min-h-[34rem] gap-5 lg:grid-cols-[16rem_1fr_18rem]">
          <aside className="rounded-md border border-zinc-300 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold uppercase text-zinc-500">
              Modes
            </h2>
            <div className="mt-4 space-y-2">
              {agentModes.map((mode, index) => (
                <button
                  className={`w-full rounded-md border px-3 py-3 text-left ${
                    index === 0
                      ? "border-teal-600 bg-teal-50"
                      : "border-zinc-200 bg-zinc-50"
                  }`}
                  key={mode.name}
                  type="button"
                >
                  <span className="block text-sm font-semibold">
                    {mode.name}
                  </span>
                  <span className="mt-1 block font-mono text-xs text-zinc-500">
                    {mode.model}
                  </span>
                  <span className="mt-2 block text-xs leading-5 text-zinc-600">
                    {mode.scope}
                  </span>
                </button>
              ))}
            </div>
          </aside>

          <section className="flex flex-col rounded-md border border-zinc-300 bg-white shadow-sm">
            <div className="border-b border-zinc-200 px-5 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Composer</h2>
                  <p className="text-sm text-zinc-600">
                    Ask, plan, edit, run checks, and prepare GitHub handoff from
                    one command surface.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700"
                    type="button"
                  >
                    Attach
                  </button>
                  <button
                    className="rounded-md bg-zinc-950 px-3 py-2 text-sm font-semibold text-white"
                    type="button"
                  >
                    Run
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-4 p-5">
              <textarea
                className="min-h-56 flex-1 resize-none rounded-md border border-zinc-300 bg-[#fbfaf7] p-4 text-base leading-7 outline-none ring-teal-600 transition focus:ring-2"
                defaultValue={
                  "Build the next founder-facing feature. Read the repo, propose the smallest useful change, edit one lane at a time, run checks, then prepare the GitHub checkpoint."
                }
              />

              <div className="grid gap-3 border-t border-zinc-200 pt-4 md:grid-cols-3">
                <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
                  <p className="font-mono text-xs uppercase text-zinc-500">
                    Context
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {contextPills.map((pill) => (
                      <span
                        className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-700"
                        key={pill}
                      >
                        {pill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
                  <p className="font-mono text-xs uppercase text-zinc-500">
                    Guardrails
                  </p>
                  <p className="mt-3 text-sm leading-6 text-zinc-700">
                    One agent edits. GitHub pushes and production deploys
                    require explicit approval.
                  </p>
                </div>

                <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
                  <p className="font-mono text-xs uppercase text-zinc-500">
                    Output
                  </p>
                  <p className="mt-3 text-sm leading-6 text-zinc-700">
                    Plan, file edits, checks, PR summary, and memory updates
                    when a decision becomes durable.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <aside className="rounded-md border border-zinc-300 bg-[#111827] p-4 text-white shadow-sm">
            <h2 className="text-sm font-semibold uppercase text-zinc-400">
              Queue
            </h2>
            <div className="mt-4 space-y-3">
              {commandQueue.map((item) => (
                <div
                  className="rounded-md border border-white/10 bg-white/5 p-3"
                  key={item.title}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold">{item.title}</p>
                    <span className="rounded-md bg-white/10 px-2 py-1 font-mono text-[0.65rem] uppercase text-teal-100">
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-2 font-mono text-xs leading-5 text-zinc-400">
                    {item.meta}
                  </p>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-md border border-zinc-300 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold">GitHub + Copilot</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
                <p className="font-mono text-xs uppercase text-zinc-500">
                  GitHub
                </p>
                <p className="mt-3 text-sm leading-6 text-zinc-700">
                  Issues, branches, PRs, reviews, and deployment checkpoints
                  stay attached to the repo.
                </p>
              </div>
              <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
                <p className="font-mono text-xs uppercase text-zinc-500">
                  Copilot
                </p>
                <p className="mt-3 text-sm leading-6 text-zinc-700">
                  Copilot remains the inline VS Code assistant while this app
                  orchestrates intent, context, checks, and handoff.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-md border border-zinc-300 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold">Model Router</h2>
            <div className="mt-5 divide-y divide-zinc-200">
              {routingRules.map(([task, model]) => (
                <div
                  className="flex items-center justify-between gap-4 py-3"
                  key={task}
                >
                  <p className="text-sm font-medium text-zinc-700">{task}</p>
                  <p className="text-right font-mono text-xs text-zinc-950">
                    {model}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
