import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pitch Tuner | Real-time AI Pitch Coach",
  description:
    "Record, analyze, and refine your startup, product, or elevator pitch with AI-driven coaching, scoring, and real-time feedback.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 antialiased">{children}</body>
    </html>
  );
}
