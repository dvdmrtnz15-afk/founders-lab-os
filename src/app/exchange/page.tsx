import type { Metadata } from "next";
import ExchangeWorkbench from "./workbench";
import "./exchange.css";

export const metadata: Metadata = {
  title: "TrueNorth Exchange",
  description:
    "A private asset decision workspace for research, comparison, due diligence and controlled transaction preparation.",
};
export default function ExchangePage() {
  return <ExchangeWorkbench />;
}
