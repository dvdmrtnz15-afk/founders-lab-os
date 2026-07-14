import Link from "next/link";

const operatingSteps = [
  ["01", "Define", "Freeze the objective, current state, risk, and authority."],
  ["02", "Prove", "Attach weighted evidence that can falsify the proposal."],
  ["03", "Decide", "Allow, hold, or block; then record a bounded receipt."],
];

const policySignals = [
  ["Canonical state", "required"],
  ["Independent proof", "risk-based"],
  ["Capability lease", "revocable"],
  ["External execution", "disabled"],
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#e7ece7] text-[#101713]">
      <header className="border-b border-[#bdc8c0] px-4 py-3 md:px-6">
        <div className="mx-auto flex max-w-[1460px] items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center bg-[#102019] font-mono text-[0.68rem] font-bold text-[#a9f1c6]">
              FL
            </span>
            <div>
              <p className="text-sm font-semibold">FounderLab OS</p>
              <p className="font-mono text-[0.6rem] text-[#607067]">
                governed agent infrastructure
              </p>
            </div>
          </div>
          <Link
            className="bg-[#102019] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1e4935] active:translate-y-px"
            href="/noesis"
          >
            Open harness
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-[1460px] gap-8 px-4 pb-10 pt-10 md:px-6 md:pb-16 md:pt-16 xl:grid-cols-[minmax(0,1.15fr)_30rem] xl:items-end">
        <div>
          <p className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#176c48]">
            TET Noesis / operational command center
          </p>
          <h1 className="mt-5 max-w-5xl text-5xl font-semibold leading-[0.94] tracking-[-0.06em] sm:text-6xl lg:text-[5.8rem]">
            Govern the work
            <span className="block text-[#728078]">
              before it becomes action.
            </span>
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-7 text-[#56645c] md:text-lg">
            A public, local-first harness for agent decisions that need
            evidence, bounded authority, and a receipt. Build the proof line in
            minutes; keep external execution off by default.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <Link
              className="bg-[#176c48] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0f5336] active:translate-y-px"
              href="/noesis"
            >
              Start a governed run
            </Link>
            <a
              className="text-sm font-semibold text-[#304138] underline decoration-[#304138]/25 underline-offset-4 hover:text-[#0d6a42]"
              download
              href="/tet-noesis-contract.yaml"
            >
              Download the agent contract
            </a>
          </div>
        </div>

        <section className="border border-[#22362c] bg-[#0b120f] p-5 text-white md:p-6">
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[#8bd9aa]">
                Default operating posture
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em]">
                Proof-gated. Local. Reversible.
              </h2>
            </div>
            <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#79e5a5] shadow-[0_0_18px_rgba(121,229,165,.55)]" />
          </div>
          <div className="mt-6 border-l border-white/15 pl-4">
            {policySignals.map(([label, value]) => (
              <div
                className="relative flex items-center justify-between gap-4 border-b border-white/8 py-3 last:border-b-0"
                key={label}
              >
                <span className="absolute -left-[1.18rem] h-2 w-2 rounded-full bg-[#79e5a5] ring-4 ring-[#0b120f]" />
                <span className="text-sm text-white/66">{label}</span>
                <span className="font-mono text-[0.62rem] uppercase text-white/38">
                  {value}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-6 grid grid-cols-3 gap-px bg-white/10 text-center">
            {[
              ["0", "network calls"],
              ["4", "warrant levels"],
              ["JSON", "portable state"],
            ].map(([value, label]) => (
              <div className="bg-[#111b16] px-2 py-3" key={label}>
                <p className="font-mono text-sm font-semibold text-[#a9f1c6]">
                  {value}
                </p>
                <p className="mt-1 text-[0.65rem] text-white/36">{label}</p>
              </div>
            ))}
          </div>
        </section>
      </section>

      <section className="border-y border-[#bdc8c0] bg-[#f4f7f3]">
        <div className="mx-auto grid max-w-[1460px] md:grid-cols-3">
          {operatingSteps.map(([number, title, body]) => (
            <article
              className="border-b border-[#d0d8d2] p-5 last:border-b-0 md:border-b-0 md:border-r md:p-7 md:last:border-r-0"
              key={number}
            >
              <p className="font-mono text-[0.65rem] text-[#4a7b60]">
                {number}
              </p>
              <h2 className="mt-5 text-xl font-semibold">{title}</h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-[#617067]">
                {body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <footer className="px-4 py-6 md:px-6">
        <div className="mx-auto flex max-w-[1460px] flex-col gap-3 text-xs text-[#66736b] sm:flex-row sm:items-center sm:justify-between">
          <p>
            Open-source foundation: Next.js, React, Zod, Vitest, Tailwind CSS.
          </p>
          <a
            className="font-semibold text-[#304138] hover:text-[#0d6a42]"
            href="https://github.com/dvdmrtnz15-afk/founders-lab-os"
          >
            View the public repository ↗
          </a>
        </div>
      </footer>
    </main>
  );
}
