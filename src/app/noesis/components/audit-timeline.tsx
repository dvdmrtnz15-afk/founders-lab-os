import type { NoesisWorkspace } from "@/lib/noesis-schema";

type AuditTimelineProps = {
  workspace: NoesisWorkspace;
};

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function AuditTimeline({ workspace }: AuditTimelineProps) {
  return (
    <details className="group border border-[#cbd4ce] bg-[#f8faf7]" id="audit">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 marker:content-none md:px-5">
        <span>
          <span className="block font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[#52705f]">
            03 / audit and receipts
          </span>
          <span className="mt-1 block text-lg font-semibold text-[#101713]">
            Local decision history
          </span>
        </span>
        <span className="font-mono text-xs text-[#65726a] group-open:hidden">
          {workspace.audit.length} events · {workspace.receipts.length} receipts
        </span>
        <span className="hidden font-mono text-xs text-[#65726a] group-open:inline">
          Close
        </span>
      </summary>
      <div className="border-t border-[#d7ddd8] px-4 py-1 md:px-5">
        {workspace.audit.slice(0, 10).map((event) => (
          <article
            className="grid gap-1 border-b border-[#dfe4e0] py-3 last:border-b-0 sm:grid-cols-[9rem_minmax(0,1fr)]"
            key={event.id}
          >
            <time
              className="font-mono text-[0.65rem] text-[#6f7c73]"
              dateTime={event.at}
            >
              {formatTimestamp(event.at)}
            </time>
            <p className="text-sm leading-5 text-[#344038]">{event.message}</p>
          </article>
        ))}
      </div>
    </details>
  );
}
