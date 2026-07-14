import Link from "next/link";

const activityItems = [
  ["EX", "Explorer"],
  ["SR", "Search"],
  ["SC", "Source Control"],
  ["RN", "Run"],
  ["AI", "Composer"],
];

const workspaceFiles = [
  ["src/app/page.tsx", "active", "UI"],
  ["src/app/noesis/page.tsx", "changed", "UI"],
  ["src/lib/noesis.ts", "changed", "TS"],
  ["docs/product/TET_NOESIS.md", "changed", "DOC"],
  ["README.md", "changed", "MD"],
];

const contextStack = [
  ["Current file", "attached"],
  ["Repo diff", "attached"],
  ["Terminal logs", "live"],
  ["Founder memory", "synced"],
  ["GitHub issue", "ready"],
  ["Preview DOM", "watching"],
];

const composerModes = [
  ["Plan", "reasoning lane", "Scope before edits", "active"],
  ["Build", "code lane", "Patch with context", "ready"],
  ["Verify", "independent lane", "Check the evidence", "ready"],
  ["Ship", "PR + preview", "Prepare handoff", "gated"],
];

const uploadSources = [
  ["Files", "Specs, PDFs, notes", "Drop or browse"],
  ["Repo", "Folders, file slices, diff", "Attach selection"],
  ["URL", "Docs, issue, preview", "Import link"],
  ["Image", "Screenshot, mock, bug shot", "Add visual"],
];

const planSteps = [
  [
    "Understand",
    "Read attached context, repo state, constraints, and recent checks.",
  ],
  [
    "Propose",
    "Draft a short implementation plan with risk, files, and acceptance criteria.",
  ],
  ["Approve", "Hold changes until the founder approves or refines the plan."],
  [
    "Execute",
    "Patch, format, lint, build, preview, summarize, and prepare GitHub handoff.",
  ],
];

const runSteps = [
  ["format", "passed", "0.8s"],
  ["lint", "passed", "1.1s"],
  ["build", "passed", "2.4s"],
  ["preview", "live", ":3000"],
  ["push", "gated", "approval"],
];

const terminalLines = [
  "$ pnpm build",
  "Compiled successfully",
  "TypeScript clean",
  "Route / prerendered",
  "$ git status --short",
  "workspace clean except approved edits",
];

const modelRoutes = [
  ["Composer", "reasoning profile", "planning"],
  ["Deep edit", "code profile", "implementation"],
  ["Fast code", "local profile", "snippets"],
  ["Verifier", "separate profile", "evidence"],
  ["Memory", "retrieval profile", "grounding"],
];

const localLaunchAgents = [
  ["Codex", "ollama launch codex", "repo edits and task execution"],
  ["Claude", "ollama launch claude", "architecture and review lane"],
  ["Codex App", "ollama launch codex-app", "desktop cockpit orchestration"],
  ["Hermes", "ollama launch hermes", "fast local coordination"],
];

const openTabs = ["page.tsx", "globals.css", "README.md", "preview"];

const commandBar = [
  ["Plan", "Generate scoped plan"],
  ["Upload", "Attach context"],
  ["Run", "Format, lint, build"],
  ["Preview", "Open local app"],
  ["PR", "Prepare GitHub handoff"],
];

const statusItems = [
  ["branch", "main / feature branch"],
  ["checks", "green"],
  ["model", "local"],
  ["preview", "127.0.0.1:3000"],
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#dfe4ea] text-slate-950">
      <section className="mx-auto flex min-h-screen w-full max-w-[1840px] flex-col border-x border-slate-300 bg-[#f5f7fa] shadow-2xl shadow-slate-400/20">
        <header className="flex min-h-12 items-center justify-between border-b border-slate-300 bg-[#172033] px-3 py-2 text-white">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-emerald-400 text-sm font-bold text-slate-950">
              FL
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">FounderLab OS</p>
              <p className="hidden truncate font-mono text-[0.68rem] text-slate-300 sm:block">
                governed local-first build cockpit
              </p>
            </div>
          </div>
          <div className="hidden min-w-0 flex-1 justify-center px-6 lg:flex">
            <div className="flex w-full max-w-2xl items-center gap-3 rounded-md border border-white/10 bg-white/10 px-3 py-1.5">
              <span className="font-mono text-[0.68rem] text-emerald-200">
                cmd+k
              </span>
              <span className="truncate text-sm text-slate-200">
                Plan, attach evidence, verify, preview, and prepare a safe
                handoff...
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              className="rounded-md bg-emerald-300 px-2.5 py-1 font-mono text-xs font-semibold text-slate-950 transition hover:bg-emerald-200"
              href="/noesis"
            >
              <span className="sm:hidden">Noesis</span>
              <span className="hidden sm:inline">Open TET Noesis</span>
            </Link>
            {["Local-first", "GitHub gated"].map((item) => (
              <span
                className="hidden rounded-md border border-white/10 bg-white/10 px-2.5 py-1 font-mono text-xs text-slate-200 xl:inline-flex"
                key={item}
              >
                {item}
              </span>
            ))}
          </div>
        </header>

        <section className="grid flex-1 lg:grid-cols-[3rem_18rem_minmax(0,1fr)_22rem]">
          <nav className="hidden border-r border-slate-300 bg-[#101827] py-3 text-slate-400 lg:block">
            <div className="flex flex-col items-center gap-2">
              {activityItems.map(([abbr, label], index) => (
                <button
                  className={`grid h-10 w-10 place-items-center rounded-md border text-[0.65rem] font-semibold transition ${
                    index === 4
                      ? "border-emerald-400 bg-emerald-400 text-slate-950"
                      : "border-transparent hover:border-white/15 hover:bg-white/10"
                  }`}
                  key={label}
                  title={label}
                  type="button"
                >
                  {abbr}
                </button>
              ))}
            </div>
          </nav>

          <aside className="border-b border-slate-300 bg-white lg:border-b-0 lg:border-r">
            <div className="border-b border-slate-200 p-3">
              <p className="text-xs font-semibold uppercase text-slate-500">
                Workspace
              </p>
              <h1 className="mt-1 text-lg font-semibold leading-6">
                A governed cockpit anyone can run locally.
              </h1>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {["Files", "Tasks", "Memory"].map((item, index) => (
                  <button
                    className={`rounded-md border px-2 py-1.5 text-xs font-semibold ${
                      index === 0
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-300 bg-slate-50 text-slate-600"
                    }`}
                    key={item}
                    type="button"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3">
              <div className="flex items-center justify-between">
                <p className="font-mono text-xs uppercase text-slate-500">
                  Explorer
                </p>
                <button
                  className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold"
                  type="button"
                >
                  New
                </button>
              </div>
              <div className="mt-3 space-y-1">
                {workspaceFiles.map(([file, state, type]) => (
                  <button
                    className={`flex w-full items-center justify-between gap-3 rounded-md border px-2 py-2 text-left text-xs transition ${
                      state === "active"
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                    key={file}
                    type="button"
                  >
                    <span className="min-w-0 truncate">{file}</span>
                    <span
                      className={`shrink-0 font-mono text-[0.65rem] ${
                        state === "changed"
                          ? "text-amber-600"
                          : state === "active"
                            ? "text-emerald-200"
                            : "text-slate-400"
                      }`}
                    >
                      {state === "changed" ? "M" : type}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-200 p-3">
              <p className="font-mono text-xs uppercase text-slate-500">
                Context Stack
              </p>
              <div className="mt-3 space-y-2">
                {contextStack.map(([item, state]) => (
                  <div
                    className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-2 py-2"
                    key={item}
                  >
                    <span className="text-xs text-slate-700">{item}</span>
                    <span className="font-mono text-[0.65rem] text-emerald-700">
                      {state}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <section className="grid min-h-[calc(100vh-3rem)] grid-rows-[auto_auto_minmax(30rem,1fr)_16rem] bg-[#eef1f5]">
            <div className="border-b border-slate-300 bg-white px-4 py-3">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <p className="font-mono text-xs font-semibold uppercase text-emerald-700">
                    Composer Core
                  </p>
                  <h2 className="text-2xl font-semibold leading-8">
                    Plan, upload, build, preview, ship from one cockpit.
                  </h2>
                </div>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  {composerModes.map(([mode, model, hint, state]) => (
                    <button
                      className={`rounded-md border px-3 py-2 text-left transition ${
                        state === "active"
                          ? "border-emerald-500 bg-emerald-50 shadow-sm"
                          : "border-slate-300 bg-slate-50 hover:bg-white"
                      }`}
                      key={mode}
                      type="button"
                    >
                      <span className="flex items-center justify-between gap-2 text-sm font-semibold">
                        {mode}
                        <span className="font-mono text-[0.62rem] text-slate-400">
                          {state}
                        </span>
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

            <div className="flex min-w-0 items-center gap-1 overflow-x-auto border-b border-slate-300 bg-[#f8fafc] px-3">
              {openTabs.map((tab, index) => (
                <button
                  className={`h-10 border-x border-t px-3 text-sm ${
                    index === 0
                      ? "border-slate-300 bg-white font-semibold text-slate-950"
                      : "border-transparent text-slate-600 hover:bg-white"
                  }`}
                  key={tab}
                  type="button"
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="grid gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
              <section className="flex min-w-0 flex-col overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">Agent Composer</p>
                      <span className="rounded-md bg-emerald-100 px-2 py-1 font-mono text-[0.68rem] font-semibold uppercase text-emerald-800">
                        Plan mode on
                      </span>
                      <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-[0.68rem] text-slate-600">
                        uploads enabled
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Plan-first orchestration with visible evidence, execution
                      gates, and IDE-grade context.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:flex">
                    {commandBar.map(([label, title], index) => (
                      <button
                        className={`rounded-md px-3 py-2 text-sm font-semibold ${
                          index === 0
                            ? "bg-slate-950 text-white"
                            : "border border-slate-300 bg-white text-slate-700"
                        }`}
                        key={label}
                        title={title}
                        type="button"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid flex-1 gap-0 lg:grid-cols-[minmax(0,1fr)_19rem]">
                  <div className="flex min-h-96 min-w-0 flex-col">
                    <div className="border-b border-slate-200 bg-[#fbfcfd] px-4 py-2">
                      <div className="flex flex-wrap gap-2">
                        {[
                          "Plan required",
                          "No env reads",
                          "No prod deploy",
                          "Push gated",
                        ].map((rule) => (
                          <span
                            className="rounded-md border border-slate-200 bg-white px-2 py-1 font-mono text-[0.68rem] text-slate-600"
                            key={rule}
                          >
                            {rule}
                          </span>
                        ))}
                      </div>
                    </div>
                    <textarea
                      className="min-h-60 flex-1 resize-none border-0 bg-[#fbfcfd] p-4 text-base leading-7 outline-none"
                      defaultValue={
                        "Plan a scoped change. Map the repository, name uncertainty, identify evidence, isolate the blocker, verify independently, run checks, and prepare a reversible handoff with a receipt."
                      }
                    />
                    <div className="border-t border-slate-200 bg-white p-3">
                      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                        {uploadSources.map(([label, value, action]) => (
                          <button
                            className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-left transition hover:border-emerald-400 hover:bg-emerald-50"
                            key={label}
                            type="button"
                          >
                            <span className="block text-xs font-semibold uppercase text-slate-500">
                              {label}
                            </span>
                            <span className="mt-1 block text-sm leading-5 text-slate-800">
                              {value}
                            </span>
                            <span className="mt-2 block font-mono text-[0.68rem] text-emerald-700">
                              {action}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <aside className="border-t border-slate-200 bg-slate-50 p-4 lg:border-l lg:border-t-0">
                    <div className="flex items-center justify-between gap-3">
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
                    ["Routing", "reason -> code -> verify"],
                    ["Result", "plan, patch, proof, receipt"],
                  ].map(([label, value]) => (
                    <button
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 text-left transition hover:border-slate-400"
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
                      <span className="ml-2 truncate font-mono text-[0.68rem] text-slate-500">
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
                        <div className="mt-4 grid grid-cols-3 gap-2">
                          {["Plan", "Run", "PR"].map((item) => (
                            <span
                              className="rounded-md bg-white/10 px-2 py-1 text-center text-xs"
                              key={item}
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-md border border-slate-300 bg-white p-4 shadow-sm">
                  <h3 className="font-semibold">Run Pipeline</h3>
                  <div className="mt-3 space-y-2">
                    {runSteps.map(([step, state, meta]) => (
                      <div
                        className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
                        key={step}
                      >
                        <span className="font-mono text-xs">{step}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[0.68rem] text-slate-400">
                            {meta}
                          </span>
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
                  {modelRoutes.map(([task, model, role]) => (
                    <div
                      className="flex items-center justify-between gap-3 rounded-md bg-white/5 px-3 py-2"
                      key={task}
                    >
                      <span className="text-xs text-slate-300">{task}</span>
                      <span className="text-right">
                        <span className="block font-mono text-xs text-white">
                          {model}
                        </span>
                        <span className="block text-[0.68rem] text-slate-500">
                          {role}
                        </span>
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
              <h2 className="mt-1 text-lg font-semibold leading-6">
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
                      className="w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-left transition hover:border-emerald-400"
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
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">GitHub</h3>
                  <span className="rounded-md bg-amber-100 px-2 py-1 font-mono text-[0.68rem] text-amber-800">
                    gated
                  </span>
                </div>
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
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Copilot</h3>
                  <span className="rounded-md bg-slate-200 px-2 py-1 font-mono text-[0.68rem] text-slate-600">
                    inline
                  </span>
                </div>
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

        <footer className="grid gap-2 border-t border-slate-300 bg-[#172033] px-3 py-2 text-white md:grid-cols-4">
          {statusItems.map(([label, value]) => (
            <div
              className="flex min-w-0 items-center justify-between gap-3 rounded-md bg-white/5 px-2 py-1"
              key={label}
            >
              <span className="font-mono text-[0.68rem] text-slate-400">
                {label}
              </span>
              <span className="truncate font-mono text-[0.68rem] text-slate-100">
                {value}
              </span>
            </div>
          ))}
        </footer>
      </section>
    </main>
  );
}
