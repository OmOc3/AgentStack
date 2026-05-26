import type { Metadata } from "next";
import type { ReactNode } from "react";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgentStack",
  description: "Generate AI-agent-ready GitHub repositories.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html className={GeistSans.variable} lang="en">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
