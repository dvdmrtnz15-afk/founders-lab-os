import type { Metadata } from "next";
import { NoesisWorkbench } from "./noesis-workbench";

export const metadata: Metadata = {
  title: "Noesis Governance Harness",
  description:
    "A local-first enterprise harness for proof-gated agent decisions, scoped capability leases, and portable execution receipts.",
};

export default function NoesisPage() {
  return <NoesisWorkbench />;
}
