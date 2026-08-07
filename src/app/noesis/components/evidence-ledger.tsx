import type { EvidenceItem, EvidenceStatus } from "@/lib/noesis-schema";

type EvidenceLedgerProps = {
  evidence: EvidenceItem[];
  onAdd: () => void;
  onChange: (id: string, patch: Partial<EvidenceItem>) => void;
  onRemove: (id: string) => void;
};

const statusOptions: EvidenceStatus[] = ["verified", "pending", "failed"];

export function EvidenceLedger({
  evidence,
  onAdd,
  onChange,
  onRemove,
}: EvidenceLedgerProps) {
  const verifiedCount = evidence.filter(
    (item) => item.status === "verified",
  ).length;

  return (
    <section
      aria-labelledby="evidence-title"
      className="border border-[#cbd4ce] bg-[#f8faf7]"
      id="evidence"
    >
      <div className="flex items-end justify-between gap-4 border-b border-[#d7ddd8] px-4 py-4 md:px-5">
        <div>
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[#52705f]">
            02 / prove the claim
          </p>
          <h2
            className="mt-1 text-xl font-semibold tracking-[-0.025em] text-[#101713]"
            id="evidence-title"
          >
            Evidence ledger
          </h2>
        </div>
        <p className="font-mono text-xs text-[#56645b]">
          {verifiedCount}/{evidence.length} verified
        </p>
      </div>

      <div className="divide-y divide-[#d7ddd8]">
        {evidence.length === 0 ? (
          <div className="px-4 py-10 text-center md:px-5">
            <p className="text-sm font-semibold text-[#26342c]">
              No proof has been attached.
            </p>
            <p className="mt-1 text-xs text-[#6c766f]">
              Add one current, reproducible claim to begin evaluation.
            </p>
          </div>
        ) : null}

        {evidence.map((item, index) => (
          <article
            className="grid gap-3 p-4 md:grid-cols-[2rem_minmax(0,1fr)_9rem_7rem] md:items-start md:p-5"
            data-evidence-id={item.id}
            key={item.id}
          >
            <span className="hidden pt-3 font-mono text-[0.65rem] text-[#8a958e] md:block">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="grid gap-3">
              <label className="grid gap-1.5">
                <span className="noesis-label">Claim</span>
                <input
                  className="noesis-input"
                  maxLength={240}
                  onChange={(event) =>
                    onChange(item.id, { claim: event.target.value })
                  }
                  value={item.claim}
                />
              </label>
              <label className="grid gap-1.5">
                <span className="noesis-label">Source or verifier</span>
                <input
                  className="noesis-input"
                  maxLength={240}
                  onChange={(event) =>
                    onChange(item.id, { source: event.target.value })
                  }
                  value={item.source}
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-1">
              <label className="grid gap-1.5">
                <span className="noesis-label">Status</span>
                <select
                  className="noesis-input"
                  onChange={(event) =>
                    onChange(item.id, {
                      status: event.target.value as EvidenceStatus,
                    })
                  }
                  value={item.status}
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1.5">
                <span className="noesis-label">Weight</span>
                <input
                  className="noesis-input font-mono"
                  max="100"
                  min="1"
                  onChange={(event) =>
                    onChange(item.id, {
                      weight: Math.min(
                        100,
                        Math.max(1, Number(event.target.value)),
                      ),
                    })
                  }
                  type="number"
                  value={item.weight}
                />
              </label>
            </div>
            <div className="flex items-center justify-between gap-3 md:grid md:justify-stretch">
              <label className="noesis-check min-h-11">
                <input
                  checked={item.independent}
                  onChange={(event) =>
                    onChange(item.id, { independent: event.target.checked })
                  }
                  type="checkbox"
                />
                Independent
              </label>
              <button
                aria-label={`Remove ${item.claim}`}
                className="min-h-11 px-2 py-2 font-mono text-[0.65rem] text-[#8b4b54] underline decoration-[#8b4b54]/30 underline-offset-4 transition hover:text-[#5e1722]"
                onClick={() => onRemove(item.id)}
                type="button"
              >
                Remove
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="border-t border-[#d7ddd8] bg-[#eef2ee] p-4 md:p-5">
        <button
          className="min-h-11 border border-[#8ea196] bg-white px-3 py-2 text-sm font-semibold text-[#1c3126] transition hover:border-[#1f6e49] hover:text-[#0d6a42]"
          onClick={onAdd}
          type="button"
        >
          Add evidence item
        </button>
      </div>
    </section>
  );
}
