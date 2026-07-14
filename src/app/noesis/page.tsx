import type { Metadata } from "next";
import { NoesisWorkbench } from "./noesis-workbench";

export const metadata: Metadata = {
  title: "TET Noesis",
  description:
    "A proof-first reference workbench for warranted autonomy, narrow recursion, independent verification, and governed execution.",
};

export default function NoesisPage() {
  return <NoesisWorkbench />;
}
