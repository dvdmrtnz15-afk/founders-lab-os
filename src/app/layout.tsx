import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "FounderLab OS",
    template: "%s | FounderLab OS",
  },
  description:
    "A public-source, local-first cockpit for governed agent workflows, proof-gated execution, mobile QA, and preview-first product development.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
