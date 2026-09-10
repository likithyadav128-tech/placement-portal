import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "PlacePrep Portal — Placement Training & Performance Management",
  description:
    "Your journey to placement readiness starts here. Track performance, take assessments, and prepare for your dream career.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="antialiased">
      <body className="font-sans text-slate-900 bg-slate-50">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
