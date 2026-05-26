"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyRepoButton({ repoUrl }: { repoUrl: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(repoUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-zinc-950"
      onClick={handleCopy}
      type="button"
    >
      {copied ? (
        <Check aria-hidden="true" className="h-4 w-4 text-emerald-300" />
      ) : (
        <Copy aria-hidden="true" className="h-4 w-4" />
      )}
      {copied ? "Copied" : "Copy URL"}
    </button>
  );
}
