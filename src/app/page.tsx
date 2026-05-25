const operatingRules = [
  "Mac first",
  "One app first",
  "One agent edits",
  "Git baseline",
  "Mobile preview",
  "Preview before prod",
];

const agentLanes = [
  {
    name: "Claude Code",
    role: "Senior repo architect",
    model: "governed edits",
    status: "Use for multi-file changes, reviews, release passports",
  },
  {
    name: "Continue",
    role: "Autocomplete and context",
    model: "qwen2.5-coder:1.5b-base",
    status: "Use for inline suggestions and quick explanations",
  },
  {
    name: "Ollama",
    role: "Local reasoning lane",
    model: "gemma3:12b / qwen2.5-coder:7b",
    status: "Use for private drafts, logs, hypotheses, summaries",
  },
  {
    name: "Roo Code",
    role: "Low-risk task runner",
    model: "qwen2.5-coder:7b",
    status: "Use for cheap local experiments only",
  },
];

const pipeline = [
  { label: "Localhost", value: "live", tone: "bg-emerald-500" },
  { label: "iPhone QA", value: "next", tone: "bg-sky-500" },
  { label: "GitHub", value: "manual", tone: "bg-zinc-500" },
  { label: "Vercel preview", value: "manual", tone: "bg-violet-500" },
  { label: "Production", value: "blocked", tone: "bg-rose-500" },
];

const modelRoutes = [
  ["Coding", "qwen2.5-coder:7b"],
  ["Reasoning", "deepseek-r1:8b"],
  ["Quality pass", "gemma3:12b"],
  ["Fast draft", "llama3.2:3b"],
  ["Embeddings", "nomic-embed-text"],
];

const qaChecks = [
  "Value clear in 5 seconds",
  "CTA reachable with one thumb",
  "No login wall before value",
  "Build and lint clean",
  "Production deploy requires review",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f6f5f1] text-zinc-950">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-5 border-b border-zinc-300 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="mb-3 font-mono text-xs font-semibold uppercase tracking-widest text-teal-700">
              Founders Lab OS
            </p>
            <h1 className="text-4xl font-semibold leading-tight text-zinc-950 sm:text-5xl lg:text-6xl">
              Governed local build loop for portfolio software.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-700 sm:text-lg">
              A Mac-first control surface for building one product at a time
              with local models, human-reviewed agent edits, phone QA, and
              preview deployments before production.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm sm:min-w-80">
            {[
              ["Build", "clean"],
              ["Memory", "on"],
              ["Prod", "locked"],
            ].map(([label, value]) => (
              <div
                className="rounded-md border border-zinc-300 bg-white px-3 py-3 shadow-sm"
                key={label}
              >
                <p className="text-xs uppercase text-zinc-500">{label}</p>
                <p className="mt-1 font-semibold text-zinc-950">{value}</p>
              </div>
            ))}
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-md border border-zinc-300 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 border-b border-zinc-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Operating Loop</h2>
                <p className="text-sm text-zinc-600">
                  Work moves left to right. Production remains explicitly gated.
                </p>
              </div>
              <p className="font-mono text-xs text-zinc-500">pnpm dev:phone</p>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-5">
              {pipeline.map((step) => (
                <div
                  className="rounded-md border border-zinc-200 bg-zinc-50 p-4"
                  key={step.label}
                >
                  <div className={`h-2 w-10 rounded-sm ${step.tone}`} />
                  <p className="mt-4 text-sm font-semibold">{step.label}</p>
                  <p className="mt-1 font-mono text-xs uppercase text-zinc-500">
                    {step.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-zinc-300 bg-[#101828] p-5 text-white shadow-sm">
            <h2 className="text-xl font-semibold">Today&apos;s Command</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-300">
              Replace generic starter screens with a real product surface,
              validate on mobile, then checkpoint clean changes.
            </p>
            <div className="mt-5 rounded-md bg-white/10 p-4 font-mono text-xs leading-6 text-teal-100">
              git status
              <br />
              pnpm build
              <br />
              open iPhone preview
              <br />
              commit only clean work
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-4">
          {agentLanes.map((agent) => (
            <article
              className="rounded-md border border-zinc-300 bg-white p-5 shadow-sm"
              key={agent.name}
            >
              <p className="font-mono text-xs uppercase text-zinc-500">
                {agent.role}
              </p>
              <h2 className="mt-3 text-2xl font-semibold">{agent.name}</h2>
              <p className="mt-2 text-sm font-medium text-teal-700">
                {agent.model}
              </p>
              <p className="mt-4 text-sm leading-6 text-zinc-600">
                {agent.status}
              </p>
            </article>
          ))}
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-md border border-zinc-300 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold">Governance Rules</h2>
            <div className="mt-5 grid grid-cols-2 gap-2">
              {operatingRules.map((rule) => (
                <div
                  className="rounded-md border border-zinc-200 bg-[#fffaf0] px-3 py-3 text-sm font-medium text-zinc-800"
                  key={rule}
                >
                  {rule}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-zinc-300 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-semibold">Model Router</h2>
              <span className="rounded-md bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
                Ollama local
              </span>
            </div>
            <div className="mt-5 divide-y divide-zinc-200">
              {modelRoutes.map(([task, model]) => (
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

        <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-md border border-zinc-300 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold">Mobile QA Checklist</h2>
            <ul className="mt-5 space-y-3">
              {qaChecks.map((check) => (
                <li className="flex gap-3 text-sm text-zinc-700" key={check}>
                  <span className="mt-1 h-2.5 w-2.5 rounded-sm bg-amber-500" />
                  <span>{check}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-md border border-zinc-300 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold">Persistent Memory</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              Durable decisions live in the FounderLab memory vault. Agents
              should read it before meaningful work and propose updates when a
              real preference, rule, or project decision becomes stable.
            </p>
            <div className="mt-5 rounded-md border border-zinc-200 bg-zinc-50 p-4 font-mono text-xs leading-6 text-zinc-700">
              ~/FounderLab/memory/founderlab.md
              <br />
              ~/FounderLab/memory/model-routing.md
              <br />
              ~/FounderLab/memory/projects/founders-lab-os.md
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
