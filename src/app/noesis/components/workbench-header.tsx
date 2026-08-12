import Link from "next/link";
import { useRef, useState, type ChangeEvent } from "react";

type WorkbenchHeaderProps = {
  saveState: "loading" | "saved" | "draft";
  onExport: () => void;
  onImport: (file: File) => void;
  onReset: () => void;
};

const saveCopy = {
  loading: "Loading workspace",
  saved: "Saved in this browser",
  draft: "Draft needs required fields",
};

export function WorkbenchHeader({
  saveState,
  onExport,
  onImport,
  onReset,
}: WorkbenchHeaderProps) {
  const [resetArmed, setResetArmed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (file) {
      onImport(file);
      event.target.value = "";
    }
  }

  function handleReset() {
    if (!resetArmed) {
      setResetArmed(true);
      return;
    }

    setResetArmed(false);
    onReset();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-[#203029] bg-[#0b120f]/95 text-[#f3f7f2] backdrop-blur-xl">
      <div className="mx-auto flex min-h-14 max-w-[1480px] items-center justify-between gap-3 px-4 py-2 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            className="grid h-8 w-8 shrink-0 place-items-center bg-[#a9f1c6] font-mono text-[0.68rem] font-bold text-[#07100c] transition hover:bg-white"
            href="/"
          >
            FL
          </Link>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-[-0.01em]">
              <span className="sm:hidden">Noesis</span>
              <span className="hidden sm:inline">
                Noesis governance harness
              </span>
            </p>
            <p className="hidden items-center gap-1.5 font-mono text-[0.62rem] text-white/46 sm:flex">
              <span
                aria-hidden="true"
                className={`h-1.5 w-1.5 rounded-full ${saveState === "draft" ? "bg-amber-300" : "bg-emerald-300"}`}
              />
              {saveCopy[saveState]}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <input
            accept="application/json,.json"
            aria-label="Choose a Noesis workspace JSON file"
            className="sr-only"
            onChange={handleImport}
            ref={inputRef}
            tabIndex={-1}
            type="file"
          />
          <button
            className="border border-white/12 px-2.5 py-2 font-mono text-[0.62rem] text-white/64 transition hover:border-white/30 hover:text-white sm:px-3 sm:text-[0.65rem]"
            onClick={() => inputRef.current?.click()}
            type="button"
          >
            Import
          </button>
          <button
            className="border border-white/12 px-2.5 py-2 font-mono text-[0.62rem] text-white/64 transition hover:border-white/30 hover:text-white sm:px-3 sm:text-[0.65rem]"
            onClick={onExport}
            type="button"
          >
            Export
          </button>
          <button
            className={`px-2.5 py-2 font-mono text-[0.62rem] transition sm:px-3 sm:text-[0.65rem] ${resetArmed ? "bg-rose-300 text-[#24090d]" : "bg-white/8 text-white/58 hover:bg-white/14 hover:text-white"}`}
            onBlur={() => setResetArmed(false)}
            onClick={handleReset}
            type="button"
          >
            {resetArmed ? "Confirm reset" : "Reset"}
          </button>
        </div>
      </div>
    </header>
  );
}
