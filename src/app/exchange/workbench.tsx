"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { createNoesisId } from "@/lib/noesis";
import {
  approvePacket,
  assetSchema,
  categories,
  createWorkspace,
  currency,
  diligence,
  economics,
  evidenceSchema,
  logEvent,
  mandateSchema,
  packetApprovalValid,
  percent,
  reviewPacket,
  updateAsset,
  updateMandate,
  type Asset,
  type Evidence,
  type Mandate,
  type Workspace,
} from "@/lib/exchange/model";
import {
  decryptVault,
  encryptVault,
  MAX_VAULT_BYTES,
  VAULT_KEY,
} from "@/lib/exchange/vault";

type View = "Opportunities" | "Compare" | "Deal room" | "Vault" | "Connections";
type Modal =
  | "asset"
  | "mandate"
  | "evidence"
  | "financials"
  | "approval"
  | "save"
  | "unlock"
  | "import"
  | "clear"
  | "lock"
  | null;
const nav: { label: View; icon: string }[] = [
  { label: "Opportunities", icon: "grid" },
  { label: "Compare", icon: "compare" },
  { label: "Deal room", icon: "folder" },
  { label: "Vault", icon: "shield" },
  { label: "Connections", icon: "link" },
];
const icons: Record<string, ReactNode> = {
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  compare: (
    <>
      <path d="M8 3v18M16 3v18M3 8h10M11 16h10" />
    </>
  ),
  folder: <path d="M3 7V5h7l2 3h9v12H3V7Z" />,
  shield: (
    <>
      <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  link: (
    <>
      <path d="m9 15 6-6M8 16l-2 2a3 3 0 0 1-4-4l5-5a3 3 0 0 1 4 0M16 8l2-2a3 3 0 0 1 4 4l-5 5a3 3 0 0 1-4 0" />
    </>
  ),
  search: (
    <>
      <circle cx="10" cy="10" r="6" />
      <path d="m15 15 6 6" />
    </>
  ),
  plus: <path d="M12 4v16M4 12h16" />,
  arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
  check: <path d="m5 12 4 4L19 6" />,
  bookmark: <path d="M6 3h12v18l-6-4-6 4V3Z" />,
  download: (
    <>
      <path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10" width="14" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  building: (
    <>
      <path d="M4 21V4h11v17M15 10h5v11M8 8h3M8 12h3M8 16h3M2 21h20" />
    </>
  ),
};
function Icon({ name, size = 20 }: { name: string; size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {icons[name] || icons.grid}
    </svg>
  );
}
function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={`ex-badge ${tone}`}>{children}</span>;
}
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="ex-field">
      <span>{label}</span>
      {children}
    </label>
  );
}
function download(
  content: string,
  filename: string,
  type = "application/json",
) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function Dialog({
  title,
  children,
  close,
  busy,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
  busy: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      className="ex-modal"
      ref={ref}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) close();
      }}
      aria-labelledby="ex-modal-title"
    >
      <div className="ex-modal-heading">
        <h2 id="ex-modal-title">{title}</h2>
        <button
          type="button"
          className="ex-icon-button"
          aria-label="Close dialog"
          disabled={busy}
          onClick={close}
        >
          ×
        </button>
      </div>
      {children}
    </dialog>
  );
}

export default function ExchangeWorkbench() {
  const [workspace, setWorkspace] = useState<Workspace>(createWorkspace);
  const [view, setView] = useState<View>("Opportunities");
  const [selectedId, setSelectedId] = useState("sample-loft");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All assets");
  const [underBudget, setUnderBudget] = useState(false);
  const [tab, setTab] = useState("Overview");
  const [modal, setModal] = useState<Modal>(null);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [hasSavedVault, setHasSavedVault] = useState(false);
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [savedRevision, setSavedRevision] = useState<Workspace | null>(null);
  const [storageError, setStorageError] = useState("");
  const [importData, setImportData] = useState("");
  const [saveDestination, setSaveDestination] = useState("browser");
  const upload = useRef<HTMLInputElement>(null);
  const vaultBaseline = useRef<string | null>(null);
  useEffect(() => {
    try {
      vaultBaseline.current = localStorage.getItem(VAULT_KEY);
      setHasSavedVault(Boolean(vaultBaseline.current));
    } catch {
      setStorageError(
        "Browser storage is unavailable. Use encrypted file exports to retain your work.",
      );
    }
  }, []);
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== VAULT_KEY && event.key !== null) return;
      setHasSavedVault(Boolean(event.newValue));
      setVaultUnlocked(false);
      setSavedRevision(null);
      setToast(
        "The saved vault changed in another tab. Unlock its latest checkpoint or export this session separately.",
      );
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(""), 6000);
    return () => clearTimeout(timeout);
  }, [toast]);
  const asset =
    workspace.assets.find((a) => a.id === selectedId) || workspace.assets[0];
  const shortlisted = workspace.assets.filter((a) => a.shortlisted);
  const filtered = workspace.assets.filter((a) => {
    const matches = `${a.name} ${a.location} ${a.type}`
      .toLowerCase()
      .includes(query.toLowerCase());
    return (
      matches &&
      (filter === "All assets" ||
        (filter === "Shortlisted" && a.shortlisted) ||
        (filter === "My assets" && !a.sample)) &&
      (!underBudget || economics(a).acquisition <= workspace.mandate.budget)
    );
  });
  const open = (value: Modal) => {
    setError("");
    setModal(value);
  };
  const close = () => {
    setModal(null);
    setError("");
    setImportData("");
  };
  const goToAsset = (id: string) => {
    setSelectedId(id);
    setTab("Overview");
    setView("Deal room");
  };
  const toggleSaved = (target: Asset) =>
    setWorkspace((current) =>
      logEvent(
        {
          ...current,
          assets: current.assets.map((a) =>
            a.id === target.id ? { ...a, shortlisted: !a.shortlisted } : a,
          ),
        },
        `${target.name} ${target.shortlisted ? "removed from" : "added to"} shortlist.`,
      ),
    );
  const exportPacket = () => {
    if (!asset) return;
    try {
      download(
        reviewPacket(workspace, asset),
        `truenorth-review-${asset.id}.md`,
        "text/markdown",
      );
      setWorkspace((current) =>
        logEvent(
          {
            ...current,
            approvals: current.approvals.filter((a) => a.assetId !== asset.id),
          },
          `Review packet exported for ${asset.name}; one-use approval consumed.`,
        ),
      );
      setToast("Review packet downloaded. No external action was taken.");
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Unable to export packet.");
    }
  };
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const value = (key: string) => String(form.get(key) || "").trim();
    const number = (key: string) => Number(form.get(key));
    try {
      if (modal === "asset") {
        const next = assetSchema.parse({
          id: createNoesisId("asset"),
          name: value("name"),
          location: value("location"),
          type: value("type"),
          price: number("price"),
          monthlyRent: number("monthlyRent"),
          monthlyExpenses: number("monthlyExpenses"),
          occupancy: number("occupancy"),
          closingCosts: number("closingCosts"),
          annualDebtService: number("annualDebtService"),
          sourceUrl: value("sourceUrl"),
          description: value("description"),
          sample: false,
          shortlisted: true,
          revision: 1,
          evidence: [],
        });
        if (workspace.assets.length >= 100)
          throw new Error("This workspace supports up to 100 assets.");
        setWorkspace((current) =>
          logEvent(
            { ...current, assets: [...current.assets, next] },
            `Added ${next.name} from user-supplied details.`,
          ),
        );
        setSelectedId(next.id);
        setView("Deal room");
        setTab("Overview");
      } else if (modal === "mandate") {
        const mandate = mandateSchema.parse({
          objective: value("objective"),
          location: value("location"),
          budget: number("budget"),
          intendedUse: value("intendedUse") as Mandate["intendedUse"],
          revision: workspace.mandate.revision,
        });
        setWorkspace((current) => updateMandate(current, mandate));
      } else if (modal === "financials" && asset) {
        const updated = {
          ...asset,
          price: number("price"),
          monthlyRent: number("monthlyRent"),
          monthlyExpenses: number("monthlyExpenses"),
          occupancy: number("occupancy"),
          closingCosts: number("closingCosts"),
          annualDebtService: number("annualDebtService"),
        };
        assetSchema.parse(updated);
        setWorkspace((current) => updateAsset(current, updated));
      } else if (modal === "evidence" && asset) {
        if (asset.evidence.length >= 40)
          throw new Error("This dossier supports up to 40 evidence records.");
        const next = evidenceSchema.parse({
          id: createNoesisId("evidence"),
          category: value("category"),
          claim: value("claim"),
          source: value("source"),
          url: value("url"),
          status: value("status"),
          observedAt: new Date(value("observedAt")).toISOString(),
        });
        setWorkspace((current) =>
          updateAsset(current, {
            ...asset,
            evidence: [...asset.evidence, next],
          }),
        );
      } else if (modal === "approval" && asset) {
        if (!form.has("confirm"))
          throw new Error("Confirm the scope to continue.");
        setWorkspace((current) => approvePacket(current, asset));
        setToast("Local packet preparation approved for this revision.");
      } else if (modal === "save") {
        if (
          hasSavedVault &&
          !vaultUnlocked &&
          value("destination") !== "download"
        )
          throw new Error(
            "Unlock the existing browser vault before replacing its checkpoint. You can still export this session as a separate file.",
          );
        const password = String(form.get("password") || "");
        if (password !== String(form.get("confirmPassword") || ""))
          throw new Error("Passphrases do not match.");
        setBusy(true);
        const snapshot = workspace;
        const encrypted = await encryptVault(snapshot, password);
        if (value("destination") === "download") {
          download(encrypted, "truenorth-exchange.vault.json");
          setToast("Encrypted vault downloaded. Keep your passphrase safe.");
        } else {
          if (localStorage.getItem(VAULT_KEY) !== vaultBaseline.current)
            throw new Error(
              "A newer checkpoint was saved in another tab. Unlock it or export your current session separately.",
            );
          localStorage.setItem(VAULT_KEY, encrypted);
          vaultBaseline.current = encrypted;
          setHasSavedVault(true);
          setVaultUnlocked(true);
          setSavedRevision(snapshot);
          setToast("Encrypted checkpoint saved in this browser.");
        }
      } else if (modal === "unlock" || modal === "import") {
        if (!form.has("replace"))
          throw new Error("Confirm replacement of the current session.");
        setBusy(true);
        const encrypted =
          modal === "import" ? importData : localStorage.getItem(VAULT_KEY);
        if (!encrypted) throw new Error("No encrypted vault found.");
        const imported = await decryptVault(
          encrypted,
          String(form.get("password") || ""),
        );
        setWorkspace(imported);
        setSelectedId(imported.assets[0]?.id || "");
        if (modal === "unlock") {
          vaultBaseline.current = encrypted;
          setVaultUnlocked(true);
          setSavedRevision(imported);
        } else {
          setVaultUnlocked(false);
          setSavedRevision(null);
        }
        setView("Opportunities");
        setToast(
          "Vault unlocked. Imported approvals were cleared; review before preparing packets.",
        );
      } else if (modal === "lock") {
        if (!form.has("confirm"))
          throw new Error("Confirm clearing the unsaved session to continue.");
        setWorkspace(createWorkspace());
        setSavedRevision(null);
        setVaultUnlocked(false);
        setSelectedId("sample-loft");
        setToast("Session cleared. Saved checkpoint remains encrypted.");
      } else if (modal === "clear") {
        if (!form.has("confirm"))
          throw new Error("Confirm removal to continue.");
        localStorage.removeItem(VAULT_KEY);
        vaultBaseline.current = null;
        setHasSavedVault(false);
        setVaultUnlocked(false);
        setSavedRevision(null);
        setWorkspace(createWorkspace());
        setSelectedId("sample-loft");
        setToast("Browser vault and active session cleared.");
      }
      close();
    } catch (e) {
      setError(
        e instanceof Error && e.name !== "ZodError"
          ? e.message
          : "Check the fields. Values must be valid, nonnegative, and within the displayed limits.",
      );
    } finally {
      setBusy(false);
    }
  };
  const loadFile = async (file?: File) => {
    if (!file) return;
    if (file.size > MAX_VAULT_BYTES) {
      setToast("Choose a vault file smaller than 4 MB.");
      return;
    }
    try {
      setImportData(await file.text());
      open("import");
    } catch {
      setToast("Unable to read that file.");
    }
  };
  const saveVault = (downloadOnly = false) => {
    if (hasSavedVault && !vaultUnlocked && !downloadOnly) open("unlock");
    else {
      setSaveDestination(downloadOnly ? "download" : "browser");
      open("save");
    }
  };
  const modalTitles: Record<Exclude<Modal, null>, string> = {
    asset: "Add an opportunity",
    mandate: "Your acquisition mandate",
    evidence: "Add supporting evidence",
    financials: "Edit financial assumptions",
    approval: "Approve packet preparation",
    save: "Encrypt this workspace",
    unlock: "Unlock your browser vault",
    import: "Import an encrypted vault",
    clear: "Clear this browser workspace",
    lock: "Lock and clear the active session",
  };
  const moneyInput = (name: string, label: string, defaultValue: number) => (
    <Field label={label}>
      <input
        name={name}
        type="number"
        required
        min="0"
        max="1000000000"
        step="0.01"
        defaultValue={defaultValue}
      />
    </Field>
  );

  return (
    <main className="exchange">
      <aside className="ex-sidebar">
        <Link href="/exchange" className="ex-brand">
          <span className="ex-monogram">
            N<span>↗</span>
          </span>
          <span>
            TRUENORTH<small>EXCHANGE</small>
          </span>
        </Link>
        <div className="ex-workspace-label">PRIVATE WORKSPACE</div>
        <nav aria-label="Exchange navigation">
          {nav.map((item) => (
            <button
              key={item.label}
              aria-label={item.label}
              onClick={() => setView(item.label)}
              className={view === item.label ? "active" : ""}
              aria-current={view === item.label ? "page" : undefined}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {item.label === "Compare" && shortlisted.length > 0 && (
                <b>{shortlisted.length}</b>
              )}
            </button>
          ))}
        </nav>
        <div className="ex-sidebar-bottom">
          <div className="ex-local-note">
            <Icon name="shield" />
            <strong>Your intent. Your authority.</strong>
            <p>
              Research and prepare here.
              <br />
              You control every commitment.
            </p>
          </div>
          <Link href="/noesis">
            Noesis decision engine <span>↗</span>
          </Link>
          <Link href="/">
            FounderLab OS <span>↗</span>
          </Link>
        </div>
      </aside>
      <div className="ex-main">
        <header className="ex-topbar">
          <div>
            <span className="ex-breadcrumb">Workspace / </span>
            <strong>{view}</strong>
          </div>
          <div className="ex-top-actions">
            <span className="ex-session-status">
              <Icon name="lock" size={15} />
              {savedRevision === workspace
                ? "Checkpoint saved"
                : "Session only"}
            </span>
            <button className="ex-button small" onClick={() => saveVault()}>
              <Icon name="shield" size={16} />
              {hasSavedVault && !vaultUnlocked
                ? "Unlock vault"
                : "Save checkpoint"}
            </button>
            <span className="ex-avatar" aria-label="Local workspace">
              TN
            </span>
          </div>
        </header>
        <div className="ex-content">
          {storageError && <div className="ex-notice">{storageError}</div>}
          {hasSavedVault && !vaultUnlocked && (
            <div className="ex-notice">
              An encrypted checkpoint is saved in this browser.{" "}
              <button onClick={() => open("unlock")}>Unlock to resume</button>.
              The current session is separate and unsaved.
            </div>
          )}
          <div className="ex-page-heading">
            <div>
              <p className="ex-eyebrow">RESEARCH. VERIFY. DECIDE.</p>
              <h1>
                {view === "Opportunities"
                  ? "Your next move, in view."
                  : view === "Compare"
                    ? "Compare the tradeoffs."
                    : view === "Deal room"
                      ? "From possibility to proof."
                      : view === "Vault"
                        ? "Private by your design."
                        : "A clear view of what’s connected."}
              </h1>
              <p>
                {view === "Opportunities"
                  ? "Keep the opportunity, the evidence, and the decision together."
                  : view === "Compare"
                    ? "A consistent view of your shortlisted opportunities."
                    : view === "Deal room"
                      ? "One dossier. Clear assumptions. Every decision recorded."
                      : view === "Vault"
                        ? "Save and restore your workspace with password-based encryption."
                        : "Use the working tools now. See exactly where external services are still needed."}
              </p>
            </div>
            {view === "Opportunities" && (
              <button
                className="ex-button primary"
                onClick={() => open("asset")}
              >
                <Icon name="plus" />
                Add opportunity
              </button>
            )}
          </div>

          {view === "Opportunities" && (
            <>
              <section className="ex-mandate">
                <div className="ex-mandate-icon">
                  <Icon name="compare" />
                </div>
                <div>
                  <p className="ex-eyebrow">YOUR MANDATE</p>
                  <h2>{workspace.mandate.objective}</h2>
                  <div className="ex-inline-meta">
                    <span>{workspace.mandate.location || "Any location"}</span>
                    <span>Up to {currency(workspace.mandate.budget)}</span>
                    <span>{workspace.mandate.intendedUse}</span>
                  </div>
                </div>
                <button
                  className="ex-button light"
                  onClick={() => open("mandate")}
                >
                  Edit mandate
                </button>
              </section>
              <div className="ex-stats">
                <Stat
                  label="Opportunities"
                  value={String(workspace.assets.length)}
                  detail={`${workspace.assets.filter((a) => !a.sample).length} added by you`}
                />
                <Stat
                  label="Shortlisted"
                  value={String(shortlisted.length)}
                  detail="Ready to compare"
                />
                <Stat
                  label="Evidence records"
                  value={String(
                    workspace.assets.reduce((n, a) => n + a.evidence.length, 0),
                  )}
                  detail="Source-linked diligence"
                />
                <Stat
                  label="External commitments"
                  value="0"
                  detail="No offers, signatures, or payments"
                />
              </div>
              <section className="ex-section">
                <div className="ex-section-heading">
                  <h2>
                    Opportunity board <span>{filtered.length}</span>
                  </h2>
                  <div className="ex-segment">
                    {["All assets", "Shortlisted", "My assets"].map((item) => (
                      <button
                        key={item}
                        className={filter === item ? "active" : ""}
                        onClick={() => setFilter(item)}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="ex-toolbar">
                  <label className="ex-search">
                    <Icon name="search" />
                    <input
                      aria-label="Search opportunities"
                      placeholder="Search by name, place, or property type"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </label>
                  <label className="ex-checkbox">
                    <input
                      type="checkbox"
                      checked={underBudget}
                      onChange={(e) => setUnderBudget(e.target.checked)}
                    />
                    Within total budget
                  </label>
                </div>
                <div className="ex-sample-note">
                  Sample properties are illustrative scenarios, not live
                  listings. Add an opportunity to work with your own
                  information.
                </div>
                <div className="ex-assets">
                  {filtered.map((item, index) => {
                    const finance = economics(item);
                    const checked = diligence(item).filter(
                      (d) => d.reviewed && !d.contradicted,
                    ).length;
                    return (
                      <article className="ex-asset" key={item.id}>
                        <div className="ex-asset-top">
                          <div
                            className={`ex-property-icon color-${index % 3}`}
                          >
                            <Icon name="building" size={26} />
                          </div>
                          <Badge tone={item.sample ? "neutral" : "blue"}>
                            {item.sample
                              ? "Illustrative sample"
                              : "User supplied"}
                          </Badge>
                          <button
                            className={`ex-icon-button bookmark ${item.shortlisted ? "saved" : ""}`}
                            aria-label={`${item.shortlisted ? "Remove" : "Add"} ${item.name} ${item.shortlisted ? "from" : "to"} shortlist`}
                            aria-pressed={item.shortlisted}
                            onClick={() => toggleSaved(item)}
                          >
                            <Icon name="bookmark" size={19} />
                          </button>
                        </div>
                        <button
                          className="ex-asset-title"
                          onClick={() => goToAsset(item.id)}
                        >
                          <h3>{item.name}</h3>
                        </button>
                        <p className="ex-muted">
                          {item.location} <span>·</span> {item.type}
                        </p>
                        <div className="ex-price">
                          {currency(item.price)}
                          <small>asking price assumption</small>
                        </div>
                        <div className="ex-asset-numbers">
                          <div>
                            <span>Est. annual NOI</span>
                            <strong>{currency(finance.noi)}</strong>
                          </div>
                          <div>
                            <span>Est. cap rate</span>
                            <strong>{percent(finance.capRate)}</strong>
                          </div>
                        </div>
                        <div className="ex-asset-footer">
                          <span>
                            <i className="ex-dot" />
                            {checked}/5 diligence areas reviewed
                          </span>
                          <button
                            aria-label={`Open ${item.name} deal room`}
                            onClick={() => goToAsset(item.id)}
                          >
                            <Icon name="arrow" />
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
                {!filtered.length && (
                  <Empty
                    title="No opportunities match"
                    body="Adjust the filters or add your own asset."
                    action={
                      <button
                        className="ex-button"
                        onClick={() => {
                          setQuery("");
                          setFilter("All assets");
                          setUnderBudget(false);
                        }}
                      >
                        Reset filters
                      </button>
                    }
                  />
                )}
              </section>
              <div className="ex-bottom-grid">
                <section className="ex-card">
                  <div className="ex-section-heading">
                    <h2>The next useful step</h2>
                    <Icon name="arrow" />
                  </div>
                  <p className="ex-muted">
                    Choose an opportunity and build its evidence record. Start
                    with permitted use and ownership before relying on rental
                    assumptions.
                  </p>
                  <button
                    className="ex-text-button"
                    onClick={() =>
                      asset ? goToAsset(asset.id) : open("asset")
                    }
                  >
                    Open a deal room <Icon name="arrow" size={16} />
                  </button>
                </section>
                <section className="ex-card ex-dark-card">
                  <Icon name="shield" size={25} />
                  <h2>Decisions stay with you.</h2>
                  <p>
                    Packet approvals cover a specific dossier revision. Changes
                    clear approval. External commitments remain unavailable.
                  </p>
                  <button
                    onClick={() => setView("Connections")}
                    className="ex-text-button"
                  >
                    View connection status <Icon name="arrow" size={16} />
                  </button>
                </section>
              </div>
            </>
          )}

          {view === "Compare" && (
            <section className="ex-card">
              {shortlisted.length < 2 ? (
                <Empty
                  title="Build a useful comparison"
                  body="Shortlist at least two opportunities using the bookmark on each card."
                  action={
                    <button
                      className="ex-button primary"
                      onClick={() => setView("Opportunities")}
                    >
                      Browse opportunities
                    </button>
                  }
                />
              ) : (
                <>
                  <div className="ex-section-heading">
                    <h2>Your shortlist</h2>
                    <Badge>{shortlisted.length} opportunities</Badge>
                  </div>
                  <div className="ex-table-wrap">
                    <table className="ex-comparison">
                      <thead>
                        <tr>
                          <th>Assumption / result</th>
                          {shortlisted.map((a) => (
                            <th key={a.id}>
                              <button onClick={() => goToAsset(a.id)}>
                                {a.name}
                              </button>
                              <small>
                                {a.sample
                                  ? "Illustrative sample"
                                  : "User supplied"}
                              </small>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          ["Purchase price", (a: Asset) => currency(a.price)],
                          [
                            "Acquisition incl. closing",
                            (a: Asset) => currency(economics(a).acquisition),
                          ],
                          [
                            "Within total budget",
                            (a: Asset) =>
                              economics(a).acquisition <=
                              workspace.mandate.budget
                                ? "Yes"
                                : "Above budget",
                          ],
                          [
                            "Monthly rent at full occupancy",
                            (a: Asset) => currency(a.monthlyRent),
                          ],
                          [
                            "Occupancy assumption",
                            (a: Asset) => `${a.occupancy}%`,
                          ],
                          [
                            "Annual operating expenses",
                            (a: Asset) => currency(economics(a).expenses),
                          ],
                          [
                            "Annual NOI",
                            (a: Asset) => currency(economics(a).noi),
                          ],
                          [
                            "Unlevered cap rate",
                            (a: Asset) => percent(economics(a).capRate),
                          ],
                          [
                            "Annual debt service",
                            (a: Asset) => currency(a.annualDebtService),
                          ],
                          [
                            "Cash flow after debt service",
                            (a: Asset) => currency(economics(a).cashFlow),
                          ],
                          [
                            "Downside NOI¹",
                            (a: Asset) =>
                              currency(
                                economics(a, Math.max(0, a.occupancy - 15)).noi,
                              ),
                          ],
                          [
                            "Diligence areas reviewed",
                            (a: Asset) =>
                              `${diligence(a).filter((d) => d.reviewed && !d.contradicted).length}/5`,
                          ],
                        ].map(([label, fn]) => (
                          <tr key={label as string}>
                            <th>{label as string}</th>
                            {shortlisted.map((a) => (
                              <td key={a.id}>
                                {(fn as (a: Asset) => string)(a)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="ex-footnote">
                    ¹ Downside reduces occupancy by 15 percentage points,
                    keeping rent and operating expenses constant. Calculations
                    use entered assumptions, not a forecast. Income taxes and
                    selling costs are excluded.
                  </p>
                </>
              )}
            </section>
          )}

          {view === "Deal room" &&
            (asset ? (
              <>
                <div className="ex-deal-top">
                  <label className="ex-asset-select">
                    <span>Select opportunity</span>
                    <select
                      value={asset.id}
                      onChange={(e) => setSelectedId(e.target.value)}
                    >
                      {workspace.assets.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="ex-inline-meta">
                    <Badge tone={asset.sample ? "neutral" : "blue"}>
                      {asset.sample ? "Illustrative sample" : "User supplied"}
                    </Badge>
                    <span>Revision {asset.revision}</span>
                    <button
                      className="ex-button"
                      onClick={() => toggleSaved(asset)}
                    >
                      <Icon name="bookmark" size={16} />
                      {asset.shortlisted ? "Shortlisted" : "Shortlist"}
                    </button>
                  </div>
                </div>
                <div
                  className="ex-tabs"
                  role="tablist"
                  aria-label="Deal room sections"
                >
                  {["Overview", "Evidence", "Financials", "Activity"].map(
                    (item) => (
                      <button
                        role="tab"
                        id={`tab-${item}`}
                        aria-controls={`panel-${item}`}
                        aria-selected={tab === item}
                        key={item}
                        className={tab === item ? "active" : ""}
                        tabIndex={tab === item ? 0 : -1}
                        onKeyDown={(event) => {
                          const tabs = [
                            "Overview",
                            "Evidence",
                            "Financials",
                            "Activity",
                          ];
                          const index = tabs.indexOf(item);
                          const next =
                            event.key === "ArrowRight"
                              ? (index + 1) % 4
                              : event.key === "ArrowLeft"
                                ? (index + 3) % 4
                                : event.key === "Home"
                                  ? 0
                                  : event.key === "End"
                                    ? 3
                                    : -1;
                          if (next >= 0) {
                            event.preventDefault();
                            setTab(tabs[next]);
                            document
                              .getElementById(`tab-${tabs[next]}`)
                              ?.focus();
                          }
                        }}
                        onClick={() => setTab(item)}
                      >
                        {item}
                      </button>
                    ),
                  )}
                </div>
                <section
                  role="tabpanel"
                  id={`panel-${tab}`}
                  aria-labelledby={`tab-${tab}`}
                >
                  {tab === "Overview" && (
                    <div className="ex-deal-grid">
                      <div>
                        <section className="ex-card">
                          <p className="ex-eyebrow">ASSET DOSSIER</p>
                          <h2 className="ex-large-title">{asset.name}</h2>
                          <p className="ex-muted">
                            {asset.location} · {asset.type}
                          </p>
                          <p className="ex-description">
                            {asset.description || "No description added."}
                          </p>
                          {asset.sourceUrl ? (
                            <a
                              className="ex-text-button"
                              href={asset.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Open supplied source ↗
                            </a>
                          ) : (
                            <Badge tone="amber">
                              Listing source not supplied
                            </Badge>
                          )}
                          <div className="ex-dossier-facts">
                            <div>
                              <span>Asking price</span>
                              <strong>{currency(asset.price)}</strong>
                            </div>
                            <div>
                              <span>Total acquisition</span>
                              <strong>
                                {currency(economics(asset).acquisition)}
                              </strong>
                            </div>
                          </div>
                        </section>
                        <section className="ex-card">
                          <div className="ex-section-heading">
                            <h2>Research brief</h2>
                            <Badge>Evidence-based checklist</Badge>
                          </div>
                          <p className="ex-muted">
                            Built from this dossier’s recorded facts. External
                            research and professional verification have not run.
                          </p>
                          <div className="ex-checklist">
                            {diligence(asset).map((d) => (
                              <div key={d.category}>
                                <span
                                  className={`ex-check-icon ${d.reviewed && !d.contradicted ? "done" : ""}`}
                                >
                                  <Icon
                                    name={
                                      d.reviewed && !d.contradicted
                                        ? "check"
                                        : "search"
                                    }
                                    size={16}
                                  />
                                </span>
                                <div>
                                  <strong>{d.category}</strong>
                                  <p>
                                    {d.contradicted
                                      ? "Resolve the contradictory record before relying on this claim."
                                      : d.reviewed
                                        ? "User marked a source reviewed. Confirm freshness and professional findings."
                                        : `Obtain supporting ${d.category.toLowerCase()} records and record the source.`}
                                  </p>
                                </div>
                                <Badge
                                  tone={
                                    d.contradicted
                                      ? "red"
                                      : d.reviewed
                                        ? "green"
                                        : "amber"
                                  }
                                >
                                  {d.contradicted
                                    ? "Conflict"
                                    : d.reviewed
                                      ? "Reviewed by you"
                                      : "Missing"}
                                </Badge>
                              </div>
                            ))}
                          </div>
                          <button
                            className="ex-text-button"
                            onClick={() => setTab("Evidence")}
                          >
                            Work on evidence <Icon name="arrow" size={16} />
                          </button>
                        </section>
                      </div>
                      <aside>
                        <section className="ex-card ex-approval-card">
                          <div className="ex-circle-icon">
                            <Icon name="shield" size={25} />
                          </div>
                          <h2>Prepare with permission.</h2>
                          <p className="ex-muted">
                            Export a review packet with this asset’s
                            assumptions, evidence, and open questions.
                          </p>
                          <div className="ex-authority-row">
                            <span>Local packet preparation</span>
                            <Badge
                              tone={
                                packetApprovalValid(workspace, asset)
                                  ? "green"
                                  : "amber"
                              }
                            >
                              {packetApprovalValid(workspace, asset)
                                ? "Approved"
                                : "Review scope"}
                            </Badge>
                          </div>
                          <div className="ex-authority-row">
                            <span>External commitments</span>
                            <Badge>Unavailable</Badge>
                          </div>
                          {packetApprovalValid(workspace, asset) ? (
                            <button
                              className="ex-button primary full"
                              onClick={exportPacket}
                            >
                              <Icon name="download" size={17} />
                              Download review packet
                            </button>
                          ) : (
                            <button
                              className="ex-button primary full"
                              onClick={() => open("approval")}
                            >
                              Review and approve <Icon name="arrow" size={17} />
                            </button>
                          )}
                          <p className="ex-footnote">
                            Noesis evaluates the local preparation scope. This
                            is not approval to purchase or transfer funds.
                          </p>
                        </section>
                        <section className="ex-card">
                          <h2>Transaction path</h2>
                          <ol className="ex-steps">
                            <li className="current">
                              <b>1</b>
                              <div>
                                Research & diligence
                                <small>Working in this workspace</small>
                              </div>
                            </li>
                            <li>
                              <b>2</b>
                              <div>
                                Professional review
                                <small>Provider not connected</small>
                              </div>
                            </li>
                            <li>
                              <b>3</b>
                              <div>
                                Contract & closing
                                <small>Provider not connected</small>
                              </div>
                            </li>
                            <li>
                              <b>4</b>
                              <div>
                                Ownership & operations
                                <small>Provider not connected</small>
                              </div>
                            </li>
                          </ol>
                        </section>
                      </aside>
                    </div>
                  )}
                  {tab === "Evidence" && (
                    <section className="ex-card">
                      <div className="ex-section-heading">
                        <div>
                          <h2>Evidence ledger</h2>
                          <p className="ex-muted">
                            Record source, observation date, and your review
                            status.
                          </p>
                        </div>
                        <button
                          className="ex-button primary"
                          onClick={() => open("evidence")}
                        >
                          <Icon name="plus" size={18} />
                          Add evidence
                        </button>
                      </div>
                      {!asset.evidence.length ? (
                        <Empty
                          title="Start with a source."
                          body="Add ownership records, rental permissions, inspection notes, financial statements, or fee agreements. Review status is your own record, not professional certification."
                        />
                      ) : (
                        <div className="ex-evidence-list">
                          {asset.evidence.map((item) => (
                            <article key={item.id}>
                              <div className="ex-inline-meta">
                                <Badge>{item.category}</Badge>
                                <Badge
                                  tone={
                                    item.status === "contradicted"
                                      ? "red"
                                      : item.status === "reviewed"
                                        ? "green"
                                        : "amber"
                                  }
                                >
                                  {item.status === "reviewed"
                                    ? "Reviewed by you"
                                    : item.status}
                                </Badge>
                                <span>
                                  {new Date(item.observedAt).toLocaleDateString(
                                    "en-US",
                                    { timeZone: "UTC" },
                                  )}
                                </span>
                              </div>
                              <h3>{item.claim}</h3>
                              <p>
                                {item.source}
                                {item.url && (
                                  <>
                                    {" "}
                                    ·{" "}
                                    <a
                                      href={item.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      Open source ↗
                                    </a>
                                  </>
                                )}
                              </p>
                              <label className="ex-inline-meta">
                                Review status{" "}
                                <select
                                  aria-label={`Review status for ${item.claim}`}
                                  value={item.status}
                                  onChange={(e) =>
                                    setWorkspace((current) =>
                                      updateAsset(current, {
                                        ...asset,
                                        evidence: asset.evidence.map((ev) =>
                                          ev.id === item.id
                                            ? {
                                                ...ev,
                                                status: e.target
                                                  .value as Evidence["status"],
                                              }
                                            : ev,
                                        ),
                                      }),
                                    )
                                  }
                                >
                                  <option value="unreviewed">Unreviewed</option>
                                  <option value="reviewed">
                                    Reviewed by me
                                  </option>
                                  <option value="contradicted">
                                    Contradicted
                                  </option>
                                </select>
                              </label>
                            </article>
                          ))}
                        </div>
                      )}
                    </section>
                  )}
                  {tab === "Financials" && (
                    <>
                      <div className="ex-section-heading">
                        <h2>Assumptions you can inspect.</h2>
                        <button
                          className="ex-button"
                          onClick={() => open("financials")}
                        >
                          Edit assumptions
                        </button>
                      </div>
                      <div className="ex-stats">
                        <Stat
                          label="Annual gross income"
                          value={currency(economics(asset).gross)}
                          detail={`At ${asset.occupancy}% occupancy`}
                        />
                        <Stat
                          label="Net operating income"
                          value={currency(economics(asset).noi)}
                          detail="Before financing and income taxes"
                        />
                        <Stat
                          label="Unlevered cap rate"
                          value={percent(economics(asset).capRate)}
                          detail="Annual NOI ÷ purchase price"
                        />
                        <Stat
                          label="Cash flow after debt"
                          value={currency(economics(asset).cashFlow)}
                          detail={`Debt service: ${currency(asset.annualDebtService)}/yr`}
                        />
                      </div>
                      <section className="ex-card">
                        <h2>Occupancy sensitivity</h2>
                        <p className="ex-muted">
                          Change occupancy only. Rent, expenses, and entered
                          debt service stay constant.
                        </p>
                        <div className="ex-scenarios">
                          {[
                            Math.max(0, asset.occupancy - 15),
                            asset.occupancy,
                            Math.min(100, asset.occupancy + 5),
                          ].map((occupancy, index) => {
                            const result = economics(asset, occupancy);
                            return (
                              <div
                                key={index}
                                className={index === 1 ? "base" : ""}
                              >
                                <p className="ex-eyebrow">
                                  {
                                    [
                                      "DOWNSIDE",
                                      "BASE ASSUMPTION",
                                      "HIGHER OCCUPANCY",
                                    ][index]
                                  }
                                </p>
                                <h3>
                                  {occupancy}% <span>occupied</span>
                                </h3>
                                <div className="ex-scenario-bar">
                                  <span style={{ width: `${occupancy}%` }} />
                                </div>
                                <dl>
                                  <dt>Annual NOI</dt>
                                  <dd>{currency(result.noi)}</dd>
                                  <dt>Cash flow after debt</dt>
                                  <dd>{currency(result.cashFlow)}</dd>
                                </dl>
                              </div>
                            );
                          })}
                        </div>
                        <p className="ex-footnote">
                          Enter taxes, insurance, maintenance, reserves,
                          utilities, HOA, and management in operating expenses
                          where applicable. No appreciation, income taxes, or
                          selling costs are modeled. These are scenarios, not
                          return promises.
                        </p>
                      </section>
                    </>
                  )}
                  {tab === "Activity" && <Activity workspace={workspace} />}
                </section>
              </>
            ) : (
              <Empty
                title="Add your first opportunity"
                body="Create an asset dossier to begin research and review."
                action={
                  <button
                    className="ex-button primary"
                    onClick={() => open("asset")}
                  >
                    Add opportunity
                  </button>
                }
              />
            ))}

          {view === "Vault" && (
            <>
              <div className="ex-vault-grid">
                <section className="ex-card">
                  <div className="ex-vault-visual">
                    <Icon name="lock" size={48} />
                    <Badge tone="green">AES-256-GCM</Badge>
                  </div>
                  <h2>Your workspace, encrypted.</h2>
                  <p className="ex-muted">
                    Save a password-encrypted checkpoint in this browser or
                    download an encrypted backup. Your passphrase stays on this
                    device and is never saved.
                  </p>
                  <div className="ex-vault-details">
                    <div>
                      <span>Browser checkpoint</span>
                      <strong>
                        {hasSavedVault
                          ? vaultUnlocked
                            ? "Unlocked this session"
                            : "Saved and locked"
                          : "None saved"}
                      </strong>
                    </div>
                    <div>
                      <span>Current changes</span>
                      <strong>
                        {savedRevision === workspace
                          ? "Checkpoint saved"
                          : "Not saved to browser"}
                      </strong>
                    </div>
                    <div>
                      <span>Cloud synchronization</span>
                      <strong>Not connected</strong>
                    </div>
                  </div>
                  <div className="ex-button-row">
                    <button
                      className="ex-button primary"
                      onClick={() => saveVault()}
                    >
                      <Icon name="shield" size={18} />
                      {hasSavedVault && !vaultUnlocked
                        ? "Unlock checkpoint"
                        : "Save checkpoint"}
                    </button>
                    <button
                      className="ex-button"
                      onClick={() => saveVault(true)}
                    >
                      <Icon name="download" size={18} />
                      Export encrypted
                    </button>
                    <button
                      className="ex-button"
                      onClick={() => upload.current?.click()}
                    >
                      Import vault
                    </button>
                  </div>
                  <p className="ex-footnote">
                    Use a long, unique passphrase. It cannot be recovered. The
                    active session is readable while open; encryption protects
                    saved checkpoints and exports. Save again after edits.
                  </p>
                  {hasSavedVault && (
                    <div className="ex-button-row">
                      <button
                        className="ex-text-button"
                        onClick={() => open("lock")}
                      >
                        Lock and clear session
                      </button>
                      <button
                        className="ex-text-button danger"
                        onClick={() => open("clear")}
                      >
                        Remove browser vault
                      </button>
                    </div>
                  )}
                </section>
                <section className="ex-card">
                  <h2>What travels with your dossier</h2>
                  <div className="ex-checklist">
                    {[
                      "Acquisition mandate and budget",
                      "Assets and financial assumptions",
                      "Evidence sources and review dates",
                      "Activity and recorded decisions",
                    ].map((item) => (
                      <div key={item}>
                        <span className="ex-check-icon done">
                          <Icon name="check" size={16} />
                        </span>
                        <strong>{item}</strong>
                      </div>
                    ))}
                  </div>
                  <p className="ex-muted">
                    Imported approvals are cleared. Review the current dossier
                    before granting a new local preparation scope.
                  </p>
                  <div className="ex-notice">
                    Encrypted exports contain sensitive information you entered.
                    Share the file and its passphrase through separate trusted
                    channels.
                  </div>
                </section>
              </div>
              <Activity workspace={workspace} />
            </>
          )}

          {view === "Connections" && (
            <>
              <section className="ex-card">
                <div className="ex-section-heading">
                  <h2>Available in this release</h2>
                  <Badge tone="green">Runs on this device</Badge>
                </div>
                <div className="ex-capabilities">
                  {[
                    [
                      "grid",
                      "Asset workspace",
                      "Create and shortlist assets, compare assumptions, and assemble dossiers.",
                    ],
                    [
                      "shield",
                      "Noesis decisions",
                      "Bind local packet approvals to the mandate and asset revision.",
                    ],
                    [
                      "lock",
                      "Encrypted vault",
                      "Encrypt, save, restore, and export your workspace with Web Crypto.",
                    ],
                  ].map(([icon, title, description]) => (
                    <article key={title}>
                      <Icon name={icon} />
                      <h3>{title}</h3>
                      <p>{description}</p>
                    </article>
                  ))}
                </div>
              </section>
              <section className="ex-card">
                <h2>External service connections</h2>
                <p className="ex-muted">
                  These require authorized providers and account configuration.
                  No external transaction or AI research is executed by this
                  release.
                </p>
                <div className="ex-connections">
                  {[
                    [
                      "Research assistant",
                      "Model-backed research, citations, and document analysis.",
                    ],
                    [
                      "Property data",
                      "Authorized listing and comparable-sales feeds.",
                    ],
                    [
                      "Legal & professional review",
                      "Licensed professionals, reviewed agreements, and signing workflows.",
                    ],
                    [
                      "Fiat & crypto settlement",
                      "Regulated payment, custody, and escrow partners.",
                    ],
                    [
                      "Rental operations",
                      "Availability, booking, maintenance, and channel integrations.",
                    ],
                    [
                      "Shared identity & storage",
                      "Authenticated accounts, role-based access, and cloud synchronization.",
                    ],
                  ].map(([title, description]) => (
                    <div key={title}>
                      <div>
                        <strong>{title}</strong>
                        <p>{description}</p>
                      </div>
                      <Badge>Not connected</Badge>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
          <footer className="ex-footer">
            <span>
              TrueNorth Exchange <b>·</b> Built on FounderLab OS
            </span>
            <span>
              USD <b>·</b> Local workspace <b>·</b> Human-controlled decisions
            </span>
          </footer>
        </div>
      </div>
      <input
        ref={upload}
        type="file"
        accept=".json,application/json"
        hidden
        aria-label="Import encrypted vault file"
        onChange={(e) => {
          void loadFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {toast && (
        <div className="ex-toast" role="status">
          <Icon name="check" size={18} />
          {toast}
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            ×
          </button>
        </div>
      )}
      {modal && (
        <Dialog title={modalTitles[modal]} close={close} busy={busy}>
          <form onSubmit={handleSubmit}>
            {modal === "asset" && (
              <>
                <p className="ex-muted">
                  Add your own details. Nothing is fetched or verified
                  automatically.
                </p>
                <div className="ex-form-grid">
                  <Field label="Asset name">
                    <input
                      name="name"
                      required
                      maxLength={120}
                      placeholder="e.g. Logan Square two-flat"
                    />
                  </Field>
                  <Field label="Location">
                    <input
                      name="location"
                      required
                      maxLength={160}
                      placeholder="City, state"
                    />
                  </Field>
                  <Field label="Property type">
                    <select name="type">
                      <option>Condo</option>
                      <option>House</option>
                      <option>Multifamily</option>
                      <option>Other</option>
                    </select>
                  </Field>
                  <Field label="Source URL (optional)">
                    <input
                      name="sourceUrl"
                      type="url"
                      maxLength={2000}
                      placeholder="https://"
                    />
                  </Field>
                  {moneyInput("price", "Purchase price (USD)", 0)}
                  {moneyInput("closingCosts", "Closing costs (USD)", 0)}
                  {moneyInput(
                    "monthlyRent",
                    "Monthly rent at full occupancy",
                    0,
                  )}
                  {moneyInput(
                    "monthlyExpenses",
                    "Monthly operating expenses",
                    0,
                  )}
                  <Field label="Occupancy assumption (%)">
                    <input
                      name="occupancy"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      defaultValue="90"
                      required
                    />
                  </Field>
                  {moneyInput("annualDebtService", "Annual debt service", 0)}
                </div>
                <Field label="Description / notes">
                  <textarea name="description" maxLength={2000} rows={3} />
                </Field>
              </>
            )}
            {modal === "mandate" && (
              <>
                <Field label="Your objective">
                  <textarea
                    name="objective"
                    required
                    minLength={3}
                    maxLength={600}
                    rows={3}
                    defaultValue={workspace.mandate.objective}
                  />
                </Field>
                <div className="ex-form-grid">
                  <Field label="Target location">
                    <input
                      name="location"
                      maxLength={160}
                      defaultValue={workspace.mandate.location}
                    />
                  </Field>
                  {moneyInput(
                    "budget",
                    "Total acquisition budget (USD)",
                    workspace.mandate.budget,
                  )}
                  <Field label="Intended use">
                    <select
                      name="intendedUse"
                      defaultValue={workspace.mandate.intendedUse}
                    >
                      <option>Personal + rental</option>
                      <option>Long-term rental</option>
                      <option>Personal use</option>
                    </select>
                  </Field>
                </div>
                <p className="ex-footnote">
                  Changing the mandate clears existing packet approvals. No
                  authority to contact, offer, sign, or pay is granted.
                </p>
              </>
            )}
            {modal === "financials" && asset && (
              <>
                <div className="ex-form-grid">
                  {moneyInput("price", "Purchase price (USD)", asset.price)}
                  {moneyInput(
                    "closingCosts",
                    "Closing costs (USD)",
                    asset.closingCosts,
                  )}
                  {moneyInput(
                    "monthlyRent",
                    "Monthly rent at full occupancy",
                    asset.monthlyRent,
                  )}
                  {moneyInput(
                    "monthlyExpenses",
                    "Monthly operating expenses",
                    asset.monthlyExpenses,
                  )}
                  <Field label="Occupancy assumption (%)">
                    <input
                      name="occupancy"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      defaultValue={asset.occupancy}
                      required
                    />
                  </Field>
                  {moneyInput(
                    "annualDebtService",
                    "Annual debt service",
                    asset.annualDebtService,
                  )}
                </div>
                <p className="ex-footnote">
                  Include all applicable operating costs. Editing these inputs
                  clears this asset’s packet approval.
                </p>
              </>
            )}
            {modal === "evidence" && (
              <>
                <div className="ex-form-grid">
                  <Field label="Diligence area">
                    <select name="category">
                      {categories.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Observed on">
                    <input
                      name="observedAt"
                      type="date"
                      required
                      max={new Date().toISOString().slice(0, 10)}
                      defaultValue={new Date().toISOString().slice(0, 10)}
                    />
                  </Field>
                </div>
                <Field label="Claim or finding">
                  <textarea
                    name="claim"
                    required
                    maxLength={600}
                    rows={3}
                    placeholder="What does the record establish, and what remains uncertain?"
                  />
                </Field>
                <Field label="Source / document name">
                  <input
                    name="source"
                    required
                    maxLength={240}
                    placeholder="e.g. Recorded deed, county record number..."
                  />
                </Field>
                <Field label="Source URL (optional)">
                  <input
                    name="url"
                    type="url"
                    maxLength={2000}
                    placeholder="https://"
                  />
                </Field>
                <Field label="Your review status">
                  <select name="status">
                    <option value="unreviewed">Unreviewed</option>
                    <option value="reviewed">Reviewed by me</option>
                    <option value="contradicted">Contradicted</option>
                  </select>
                </Field>
                <p className="ex-footnote">
                  This records your assessment. It does not certify ownership,
                  legal use, or professional verification.
                </p>
              </>
            )}
            {modal === "approval" && asset && (
              <>
                <p className="ex-muted">
                  Authorize one type of action for the current dossier.
                </p>
                <div className="ex-approval-summary">
                  <strong>{asset.name}</strong>
                  <p>
                    Asset revision {asset.revision} · Mandate revision{" "}
                    {workspace.mandate.revision}
                  </p>
                  <dl>
                    <dt>Allowed</dt>
                    <dd>Prepare and download a local review packet</dd>
                    <dt>Excluded</dt>
                    <dd>
                      Contact, offers, signatures, payments, title transfers
                    </dd>
                  </dl>
                </div>
                <label className="ex-checkbox">
                  <input name="confirm" type="checkbox" required />I approve
                  this local preparation scope.
                </label>
                <p className="ex-footnote">
                  Approval records intent in this workspace. It is not a digital
                  signature or a purchase authorization. Material edits
                  invalidate it.
                </p>
              </>
            )}
            {modal === "save" && (
              <>
                <p className="ex-muted">
                  Choose a unique passphrase with at least 12 characters. Losing
                  it means losing access to the encrypted file.
                </p>
                <Field label="Destination">
                  <select name="destination" defaultValue={saveDestination}>
                    <option
                      value="browser"
                      disabled={hasSavedVault && !vaultUnlocked}
                    >
                      This browser checkpoint
                    </option>
                    <option value="download">Download encrypted file</option>
                  </select>
                </Field>
                <Field label="Passphrase">
                  <input
                    name="password"
                    type="password"
                    required
                    minLength={12}
                    maxLength={1024}
                    autoComplete="new-password"
                  />
                </Field>
                <Field label="Confirm passphrase">
                  <input
                    name="confirmPassword"
                    type="password"
                    required
                    minLength={12}
                    maxLength={1024}
                    autoComplete="new-password"
                  />
                </Field>
                <p className="ex-footnote">
                  An existing checkpoint is replaced only after encryption
                  succeeds. No recovery key is stored.
                </p>
              </>
            )}
            {(modal === "unlock" || modal === "import") && (
              <>
                <p className="ex-muted">
                  Unlock the encrypted workspace. Your current unsaved session
                  will be replaced.
                </p>
                <Field label="Passphrase">
                  <input
                    name="password"
                    type="password"
                    required
                    minLength={12}
                    maxLength={1024}
                    autoComplete="current-password"
                  />
                </Field>
                <label className="ex-checkbox">
                  <input name="replace" type="checkbox" required />
                  Replace the current session with this vault.
                </label>
              </>
            )}
            {modal === "lock" && (
              <>
                <p className="ex-muted">
                  This clears the active session. Any changes since your last
                  checkpoint will be lost. The saved encrypted checkpoint
                  remains in this browser.
                </p>
                <label className="ex-checkbox">
                  <input name="confirm" type="checkbox" required />
                  Clear the session and discard unsaved changes.
                </label>
              </>
            )}
            {modal === "clear" && (
              <>
                <p className="ex-muted">
                  This removes the saved encrypted checkpoint from this browser
                  and clears the active session. Download a backup first if you
                  need to keep it.
                </p>
                <label className="ex-checkbox">
                  <input name="confirm" type="checkbox" required />
                  Remove the browser checkpoint and session.
                </label>
              </>
            )}
            {error && (
              <p className="ex-error" role="alert">
                {error}
              </p>
            )}
            <div className="ex-modal-actions">
              <button
                type="button"
                className="ex-button"
                disabled={busy}
                onClick={close}
              >
                Cancel
              </button>
              <button
                className={`ex-button ${modal === "clear" ? "destructive" : "primary"}`}
                type="submit"
                disabled={busy}
              >
                {busy
                  ? "Working…"
                  : modal === "asset"
                    ? "Add opportunity"
                    : modal === "approval"
                      ? "Approve preparation"
                      : modal === "save"
                        ? "Encrypt and save"
                        : modal === "unlock" || modal === "import"
                          ? "Unlock workspace"
                          : modal === "clear"
                            ? "Remove checkpoint"
                            : modal === "lock"
                              ? "Lock and clear"
                              : "Save changes"}
              </button>
            </div>
          </form>
        </Dialog>
      )}
    </main>
  );
}
function Stat({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <section className="ex-stat">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </section>
  );
}
function Empty({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="ex-empty">
      <Icon name="folder" size={34} />
      <h3>{title}</h3>
      <p>{body}</p>
      {action}
    </div>
  );
}
function Activity({ workspace }: { workspace: Workspace }) {
  return (
    <section className="ex-card">
      <div className="ex-section-heading">
        <h2>Workspace activity</h2>
        <Badge>Device-local record</Badge>
      </div>
      {workspace.events.length === 0 ? (
        <Empty
          title="Your decisions start here"
          body="Asset changes, evidence updates, and packet approvals appear in this record."
        />
      ) : (
        <ol className="ex-activity">
          {workspace.events.map((event) => (
            <li key={event.id}>
              <Icon name="clock" size={16} />
              <div>
                <p>{event.message}</p>
                <time dateTime={event.at}>
                  {new Date(event.at).toLocaleString()}
                </time>
              </div>
            </li>
          ))}
        </ol>
      )}
      <p className="ex-footnote">
        This is an editable local activity history, not an independently signed
        or immutable audit log.
      </p>
    </section>
  );
}
