import type {
  CapabilityLease,
  NoesisWorkspace,
  WarrantLevel,
} from "@/lib/noesis-schema";
import { formatPercent, warrantPolicies } from "@/lib/noesis";

type WorkspaceEditorProps = {
  workspace: NoesisWorkspace;
  onLeaseChange: (patch: Partial<CapabilityLease>) => void;
  onWorkspaceChange: (patch: Partial<NoesisWorkspace>) => void;
};

const warrantLevels = Object.keys(warrantPolicies) as WarrantLevel[];

function toDateTimeLocal(value: string | null): string {
  if (!value) return "";

  const date = new Date(value);
  const localTime = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000,
  );
  return localTime.toISOString().slice(0, 16);
}

export function WorkspaceEditor({
  workspace,
  onLeaseChange,
  onWorkspaceChange,
}: WorkspaceEditorProps) {
  const policy = warrantPolicies[workspace.warrantLevel];

  return (
    <section
      aria-labelledby="run-definition-title"
      className="border border-[#cbd4ce] bg-[#f8faf7]"
      id="definition"
    >
      <div className="flex flex-col gap-3 border-b border-[#d7ddd8] px-4 py-4 sm:flex-row sm:items-end sm:justify-between md:px-5">
        <div>
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[#52705f]">
            01 / define the run
          </p>
          <h2
            className="mt-1 text-xl font-semibold tracking-[-0.025em] text-[#101713]"
            id="run-definition-title"
          >
            Objective and authority
          </h2>
        </div>
        <p className="max-w-xs text-xs leading-5 text-[#647068]">
          Required fields must remain valid before the workspace is persisted.
        </p>
      </div>

      <div className="grid gap-5 p-4 md:grid-cols-2 md:p-5">
        <label className="grid gap-2 md:col-span-2">
          <span className="noesis-label">Workspace name</span>
          <input
            className="noesis-input text-base font-semibold"
            maxLength={120}
            onChange={(event) =>
              onWorkspaceChange({ title: event.target.value })
            }
            required
            value={workspace.title}
          />
        </label>

        <label className="grid gap-2 md:col-span-2">
          <span className="noesis-label">Testable objective</span>
          <textarea
            className="noesis-input min-h-24 resize-y text-base leading-6"
            maxLength={600}
            onChange={(event) =>
              onWorkspaceChange({ objective: event.target.value })
            }
            required
            value={workspace.objective}
          />
        </label>

        <label className="grid gap-2">
          <span className="noesis-label">Warrant level</span>
          <select
            className="noesis-input"
            onChange={(event) =>
              onWorkspaceChange({
                warrantLevel: event.target.value as WarrantLevel,
              })
            }
            value={workspace.warrantLevel}
          >
            {warrantLevels.map((level) => (
              <option key={level} value={level}>
                {warrantPolicies[level].label}
              </option>
            ))}
          </select>
          <span className="text-xs leading-5 text-[#6c766f]">
            {formatPercent(policy.minimumCoverage)} proof · max{" "}
            {formatPercent(policy.maximumUncertainty)} uncertainty
          </span>
        </label>

        <label className="grid gap-2">
          <span className="flex items-center justify-between gap-3">
            <span className="noesis-label">Calibrated uncertainty</span>
            <span className="flex items-center gap-2">
              <input
                aria-label="Uncertainty percent"
                className="noesis-input min-h-8 w-16 px-2 py-1 text-right font-mono text-sm font-semibold text-[#0d6a42]"
                max="100"
                min="0"
                onChange={(event) =>
                  onWorkspaceChange({
                    uncertainty:
                      Math.min(100, Math.max(0, Number(event.target.value))) /
                      100,
                  })
                }
                type="number"
                value={Math.round(workspace.uncertainty * 100)}
              />
              <output className="font-mono text-xs text-[#567060]">%</output>
            </span>
          </span>
          <input
            aria-label="Calibrated uncertainty"
            className="mt-2 w-full accent-[#137a4d]"
            max="100"
            min="0"
            onChange={(event) =>
              onWorkspaceChange({
                uncertainty: Number(event.target.value) / 100,
              })
            }
            type="range"
            value={Math.round(workspace.uncertainty * 100)}
          />
          <span className="text-xs leading-5 text-[#6c766f]">
            Estimate what remains unknown; confidence is not evidence.
          </span>
        </label>

        <label className="grid gap-2 md:col-span-2">
          <span className="noesis-label">Canonical current state</span>
          <textarea
            className="noesis-input min-h-28 resize-y leading-6"
            maxLength={1200}
            onChange={(event) =>
              onWorkspaceChange({ canonicalState: event.target.value })
            }
            required
            value={workspace.canonicalState}
          />
        </label>

        <label className="grid gap-2 md:col-span-2">
          <span className="noesis-label">Blocking subproblem</span>
          <textarea
            className="noesis-input min-h-20 resize-y leading-6"
            maxLength={500}
            onChange={(event) =>
              onWorkspaceChange({ blocker: event.target.value })
            }
            required
            value={workspace.blocker}
          />
        </label>
      </div>

      <div className="border-t border-[#d7ddd8] bg-[#eef2ee] p-4 md:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="noesis-label">Semantic capability lease</p>
            <h3 className="mt-1 text-lg font-semibold text-[#101713]">
              Bound the dry-run adapter
            </h3>
          </div>
          <span className="font-mono text-[0.65rem] text-[#667269]">
            No network or shell adapter connected
          </span>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 md:col-span-2">
            <span className="noesis-label">Allowed scope</span>
            <input
              className="noesis-input"
              maxLength={300}
              onChange={(event) => onLeaseChange({ scope: event.target.value })}
              required
              value={workspace.lease.scope}
            />
          </label>
          <label className="grid gap-2">
            <span className="noesis-label">Permitted tools</span>
            <input
              className="noesis-input"
              onChange={(event) =>
                onLeaseChange({
                  tools: event.target.value
                    .split(",")
                    .map((tool) => tool.trim())
                    .filter(Boolean)
                    .slice(0, 12),
                })
              }
              placeholder="read workspace, run tests"
              value={workspace.lease.tools.join(", ")}
            />
          </label>
          <label className="grid gap-2">
            <span className="noesis-label">Budget</span>
            <input
              className="noesis-input"
              maxLength={160}
              onChange={(event) =>
                onLeaseChange({ budget: event.target.value })
              }
              required
              value={workspace.lease.budget}
            />
          </label>
          <label className="grid gap-2">
            <span className="noesis-label">Expiry (optional)</span>
            <input
              className="noesis-input"
              onChange={(event) =>
                onLeaseChange({
                  expiresAt: event.target.value
                    ? new Date(event.target.value).toISOString()
                    : null,
                })
              }
              type="datetime-local"
              value={toDateTimeLocal(workspace.lease.expiresAt)}
            />
          </label>
          <div className="grid gap-2">
            <span className="noesis-label">Authority controls</span>
            <div className="grid min-h-11 grid-cols-2 gap-2">
              <label className="noesis-check">
                <input
                  checked={workspace.lease.active}
                  onChange={(event) =>
                    onLeaseChange({ active: event.target.checked })
                  }
                  type="checkbox"
                />
                Lease active
              </label>
              <label
                className={`noesis-check ${!workspace.lease.approvalRequired ? "opacity-45" : ""}`}
              >
                <input
                  checked={workspace.lease.approvalGranted}
                  disabled={!workspace.lease.approvalRequired}
                  onChange={(event) =>
                    onLeaseChange({ approvalGranted: event.target.checked })
                  }
                  type="checkbox"
                />
                Approved
              </label>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
