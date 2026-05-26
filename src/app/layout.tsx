import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/react";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://agentstack.vercel.app"),
  title: "AgentStack — AI-ready GitHub repo generator",
  description:
    "Pick a stack, connect GitHub, get a repo pre-loaded with CLAUDE.md, AGENT.md, and .cursorrules in seconds.",
  openGraph: {
    title: "AgentStack — AI-ready GitHub repo generator",
    description:
      "Pick a stack, connect GitHub, get a repo pre-loaded with CLAUDE.md, AGENT.md, and .cursorrules in seconds.",
    url: "https://agentstack.vercel.app",
    siteName: "AgentStack",
    images: [{ url: "/api/og", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AgentStack — AI-ready GitHub repo generator",
    description:
      "Pick a stack, connect GitHub, get a repo pre-loaded with CLAUDE.md, AGENT.md, and .cursorrules in seconds.",
    images: ["/api/og"],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html className={GeistSans.variable} lang="en">
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
