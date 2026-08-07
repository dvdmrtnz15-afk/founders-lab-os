import type { Metadata } from "next";
import { NoesisWorkbench } from "./noesis-workbench";

export const metadata: Metadata = {
  title: "Noesis Probability-Flow Governance Harness",
  description:
    "A local-first harness for probability-flow forecasts, protected-boundary gates, scoped capability leases, and replayable execution receipts.",
};

export default function NoesisPage() {
  return <NoesisWorkbench />;
}
