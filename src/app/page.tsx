const activityItems = ["Files", "Search", "Git", "Run", "AI"];

const fileTree = [
  ["src/app/page.tsx", "active"],
  ["src/app/globals.css", "idle"],
  ["docs/codex/github-connector-visibility.md", "changed"],
  ["docs/memory/local-model-inventory.md", "idle"],
  ["README.md", "changed"],
];

const contextStack = [
  "Current file",
  "Repo diff",
  "Terminal logs",
  "Founder memory",
  "GitHub issue",
  "Preview DOM",
];

const composerModes = [
  ["Plan", "gemma4:e4b", "Scope before edits"],
  ["Build", "qwen3.6:27b", "Patch with context"],
  ["Copilot", "GitHub", "Inline assist"],
  ["Ship", "PR + Vercel", "Prepare handoff"],
];

const uploadSources = [
  ["Files", "Upload specs, screenshots, notes"],
  ["Repo", "Attach folders, files, or diff"],
  ["URL", "Import docs, issue, preview"],
  ["Image", "Design reference or bug shot"],
];

const planSteps = [
  ["Understand", "Read attached context and repo state"],
  ["Propose", "Draft the smallest useful implementation plan"],
  ["Approve", "Wait for human approval before edits"],
  ["Execute", "Patch, run checks, preview, summarize"],
];

const runSteps = [
  ["format", "passed"],
  ["lint", "passed"],
  ["build", "passed"],
  ["preview", "live"],
  ["push", "gated"],
];

const terminalLines = [
  "$ pnpm build",
  "Compiled successfully in 1.4s",
  "TypeScript clean",
  "Static route / ready",
  "$ git status --short",
  "workspace clean",
];

const modelRoutes = [
  ["Composer", "gemma4:e4b"],
  ["Deep edit", "qwen3.6:27b"],
  ["Fast code", "qwen2.5-coder:7b"],
  ["Inline", "Copilot"],
  ["Memory", "nomic-embed-text"],
];

const localLaunchAgents = [
  ["Codex", "ollama launch codex", "repo edits and task execution"],
  ["Claude", "ollama launch claude", "architecture and review lane"],
  ["Codex App", "ollama launch codex-app", "desktop cockpit orchestration"],
  ["Hermes", "ollama launch hermes", "fast local coordination"],
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#eceff3] text-slate-950">
      <section className="mx-auto flex min-h-screen w-full max-w-[1800px] flex-col border-x border-slate-300 bg-[#f7f8fa]">
        <header className="flex h-12 items-center justify-between border-b border-slate-300 bg-[#1f2937] px-3 text-white">
          <div className="flex items-center gap-3">
            <div className="grid h-7 w-7 place-items-center rounded-md bg-emerald-500 text-sm font-bold text-slate-950">
              FL
            </div>
            <div>
              <p className="text-sm font-semibold">Founders Lab OS</p>
              <p className="font-mono text-[0.68rem] text-slate-300">
                founders-lab-os / pr/commit-current-founders-lab-os
              </p>
            </div>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            {["Localhost :3000", "GitHub gated", "Vercel preview"].map(
              (item) => (
                <span
                  className="rounded-md border border-white/10 bg-white/10 px-2.5 py-1 font-mono text-xs text-slate-200"
                  key={item}
                >
                  {item}
                </span>
              ),
            )}
          </div>
        </header>

        <section className="grid flex-1 lg:grid-cols-[3rem_17rem_minmax(0,1fr)_21rem]">
          <nav className="hidden border-r border-slate-300 bg-[#111827] py-3 text-slate-400 lg:block">
            <div className="flex flex-col items-center gap-2">
              {activityItems.map((item, index) => (
                <button
                  className={`grid h-10 w-10 place-items-center rounded-md border text-[0.65rem] font-semibold ${
                    index === 4
                      ? "border-emerald-400 bg-emerald-400 text-slate-950"
                      : "border-transparent hover:border-white/15 hover:bg-white/10"
                  }`}
                  key={item}
                  title={item}
                  type="button"
                >
                  {item.slice(0, 2)}
                </button>
              ))}
            </div>
          </nav>

          <aside className="border-b border-slate-300 bg-white lg:border-b-0 lg:border-r">
            <div className="border-b border-slate-200 p-3">
              <p className="text-xs font-semibold uppercase text-slate-500">
                Workspace
              </p>
              <h1 className="mt-1 text-lg font-semibold">
                Cursor-grade context, Replit-speed run loop.
              </h1>
            </div>
            <div className="p-3">
              <p className="font-mono text-xs uppercase text-slate-500">
                Explorer
              </p>
              <div className="mt-3 space-y-1">
                {fileTree.map(([file, state]) => (
                  <button
                    className={`flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-xs ${
                      state === "active"
                        ? "bg-slate-900 text-white"
                        : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                    key={file}
                    type="button"
                  >
                    <span className="truncate">{file}</span>
                    {state === "changed" ? (
                      <span className="ml-2 text-amber-600">M</span>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t border-slate-200 p-3">
              <p className="font-mono text-xs uppercase text-slate-500">
                Context Stack
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {contextStack.map((item) => (
                  <span
                    className="rounded-md border border-slate-300 bg-slate-50 px-2 py-1 text-xs text-slate-700"
                    key={item}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </aside>

          <section className="grid min-h-[calc(100vh-3rem)] grid-rows-[auto_minmax(28rem,1fr)_16rem] bg-[#eef1f5]">
            <div className="border-b border-slate-300 bg-white px-4 py-3">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <p className="font-mono text-xs font-semibold uppercase text-emerald-700">
                    Composer Core
                  </p>
                  <h2 className="text-2xl font-semibold">
                    Plan, upload context, build, preview, ship.
                  </h2>
                </div>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  {composerModes.map(([mode, model, hint], index) => (
                    <button
                      className={`rounded-md border px-3 py-2 text-left ${
                        index === 1
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-slate-300 bg-slate-50"
                      }`}
                      key={mode}
                      type="button"
                    >
                      <span className="block text-sm font-semibold">
                        {mode}
                      </span>
                      <span className="mt-1 block font-mono text-[0.68rem] text-slate-500">
                        {model}
                      </span>
                      <span className="mt-1 block text-xs text-slate-600">
                        {hint}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
              <section className="flex flex-col rounded-md border border-slate-300 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">Agent Composer</p>
                      <span className="rounded-md bg-emerald-100 px-2 py-1 font-mono text-[0.68rem] font-semibold uppercase text-emerald-800">
                        Plan mode on
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Replit-agent style planning with Codex execution rules.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
                      type="button"
                    >
                      Upload
                    </button>
                    <button
                      className="rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white"
                      type="button"
                    >
                      Generate Plan
                    </button>
                  </div>
                </div>

                <div className="grid flex-1 gap-0 lg:grid-cols-[minmax(0,1fr)_18rem]">
                  <div className="flex min-h-96 flex-col">
                    <textarea
                      className="min-h-56 flex-1 resize-none border-0 bg-[#fbfcfd] p-4 text-base leading-7 outline-none"
                      defaultValue={
                        "Plan this before editing: make Founders Lab OS feel like a coder's agent workspace with uploadable context, plan approval, live preview, terminal checks, GitHub handoff, and local Ollama launch agents."
                      }
                    />
                    <div className="border-t border-slate-200 bg-white p-3">
                      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                        {uploadSources.map(([label, value]) => (
                          <button
                            className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-left hover:border-emerald-400 hover:bg-emerald-50"
                            key={label}
                            type="button"
                          >
                            <span className="block text-xs font-semibold uppercase text-slate-500">
                              {label}
                            </span>
                            <span className="mt-1 block text-sm leading-5 text-slate-800">
                              {value}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <aside className="border-t border-slate-200 bg-slate-50 p-4 lg:border-l lg:border-t-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Plan Preview</h3>
                      <span className="rounded-md bg-amber-100 px-2 py-1 font-mono text-[0.68rem] text-amber-800">
                        approval required
                      </span>
                    </div>
                    <div className="mt-4 space-y-3">
                      {planSteps.map(([step, detail], index) => (
                        <div
                          className="rounded-md border border-slate-200 bg-white p-3"
                          key={step}
                        >
                          <div className="flex items-center gap-2">
                            <span className="grid h-6 w-6 place-items-center rounded-md bg-slate-900 font-mono text-xs text-white">
                              {index + 1}
                            </span>
                            <p className="text-sm font-semibold">{step}</p>
                          </div>
                          <p className="mt-2 text-xs leading-5 text-slate-600">
                            {detail}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold"
                        type="button"
                      >
                        Refine
                      </button>
                      <button
                        className="rounded-md bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-950"
                        type="button"
                      >
                        Approve
                      </button>
                    </div>
                  </aside>
                </div>

                <div className="grid gap-2 border-t border-slate-200 bg-slate-50 p-3 md:grid-cols-4">
                  {[
                    ["Mode", "Plan before build"],
                    ["Context", "uploads + repo"],
                    ["Model", "gemma4 -> qwen3.6"],
                    ["Result", "plan, patch, preview, PR"],
                  ].map(([label, value]) => (
                    <button
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 text-left"
                      key={label}
                      type="button"
                    >
                      <span className="block text-xs font-semibold uppercase text-slate-500">
                        {label}
                      </span>
                      <span className="mt-1 block text-sm text-slate-800">
                        {value}
                      </span>
                    </button>
                  ))}
                </div>
              </section>

              <aside className="grid gap-4">
                <section className="rounded-md border border-slate-300 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Live Preview</h3>
                    <span className="rounded-md bg-emerald-100 px-2 py-1 font-mono text-xs text-emerald-800">
                      running
                    </span>
                  </div>
                  <div className="mt-4 overflow-hidden rounded-md border border-slate-300 bg-[#f8fafc]">
                    <div className="flex h-8 items-center gap-2 border-b border-slate-200 bg-white px-3">
                      <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                      <span className="ml-2 font-mono text-[0.68rem] text-slate-500">
                        localhost:3000
                      </span>
                    </div>
                    <div className="p-4">
                      <div className="rounded-md bg-slate-950 p-4 text-white">
                        <p className="text-xs uppercase text-emerald-300">
                          Founder cockpit
                        </p>
                        <p className="mt-2 text-xl font-semibold">
                          Compose. Run. Preview. Ship.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-md border border-slate-300 bg-white p-4 shadow-sm">
                  <h3 className="font-semibold">Run Pipeline</h3>
                  <div className="mt-3 space-y-2">
                    {runSteps.map(([step, state]) => (
                      <div
                        className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
                        key={step}
                      >
                        <span className="font-mono text-xs">{step}</span>
                        <span
                          className={`rounded-md px-2 py-1 font-mono text-[0.68rem] ${
                            state === "gated"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {state}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              </aside>
            </div>

            <section className="grid border-t border-slate-300 bg-[#0f172a] text-white lg:grid-cols-[minmax(0,1fr)_22rem]">
              <div className="border-b border-white/10 p-4 lg:border-b-0 lg:border-r">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Terminal</h3>
                  <span className="font-mono text-xs text-slate-400">
                    zsh / pnpm / git
                  </span>
                </div>
                <div className="mt-3 space-y-1 font-mono text-xs leading-5 text-emerald-100">
                  {terminalLines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-sm font-semibold">Model Router</h3>
                <div className="mt-3 space-y-2">
                  {modelRoutes.map(([task, model]) => (
                    <div
                      className="flex items-center justify-between gap-3 rounded-md bg-white/5 px-3 py-2"
                      key={task}
                    >
                      <span className="text-xs text-slate-300">{task}</span>
                      <span className="font-mono text-xs text-white">
                        {model}
                      </span>
                    </div>
                  ))}
                  {localLaunchAgents.map(([agent, command]) => (
                    <div
                      className="flex items-center justify-between gap-3 rounded-md bg-emerald-400/10 px-3 py-2"
                      key={agent}
                    >
                      <span className="text-xs text-emerald-100">{agent}</span>
                      <span className="font-mono text-xs text-emerald-200">
                        {command}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </section>

          <aside className="border-t border-slate-300 bg-white lg:border-l lg:border-t-0">
            <div className="border-b border-slate-200 p-4">
              <p className="text-xs font-semibold uppercase text-slate-500">
                Ship Center
              </p>
              <h2 className="mt-1 text-lg font-semibold">
                Replit-like run and deploy, GitHub-safe by default.
              </h2>
            </div>

            <div className="space-y-4 p-4">
              <section className="rounded-md border border-emerald-300 bg-emerald-50 p-4">
                <h3 className="font-semibold">Ollama Launch Agents</h3>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  Local agent launch commands sit next to the composer so the
                  cockpit can route work into the right lane.
                </p>
                <div className="mt-4 space-y-2">
                  {localLaunchAgents.map(([agent, command, role]) => (
                    <button
                      className="w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-left"
                      key={agent}
                      type="button"
                    >
                      <span className="block text-sm font-semibold">
                        {agent}
                      </span>
                      <span className="mt-1 block font-mono text-xs text-emerald-700">
                        {command}
                      </span>
                      <span className="mt-1 block text-xs text-slate-500">
                        {role}
                      </span>
                    </button>
                  ))}
                </div>
              </section>

              <section className="rounded-md border border-slate-300 bg-slate-50 p-4">
                <h3 className="font-semibold">GitHub</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Issues, branches, pull requests, and reviews stay connected to
                  repo checkpoints.
                </p>
                <button
                  className="mt-4 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold"
                  type="button"
                >
                  Prepare PR
                </button>
              </section>

              <section className="rounded-md border border-slate-300 bg-slate-50 p-4">
                <h3 className="font-semibold">Copilot</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Keep Copilot as the inline code accelerator; the composer owns
                  intent and orchestration.
                </p>
                <button
                  className="mt-4 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold"
                  type="button"
                >
                  Open VS Code
                </button>
              </section>

              <section className="rounded-md border border-slate-300 bg-slate-950 p-4 text-white">
                <h3 className="font-semibold">Production Gate</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Preview deploys are allowed after checks. Production waits for
                  explicit approval.
                </p>
                <button
                  className="mt-4 w-full rounded-md bg-amber-300 px-3 py-2 text-sm font-semibold text-slate-950"
                  type="button"
                >
                  Request Approval
                </button>
              </section>
            </div>
          </aside>
        </section>
      </section>
    </main>
  );
}
