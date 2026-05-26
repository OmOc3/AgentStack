"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { trackFileCopied } from "@/lib/events";

type CopyFileButtonProps = {
  content: string;
  filename: string;
};

export function CopyFileButton({ content, filename }: CopyFileButtonProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  async function handleCopy() {
    await navigator.clipboard.writeText(content);
    trackFileCopied(filename);
    setCopied(true);

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => setCopied(false), 1500);
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <button
      aria-label={copied ? "Copied file contents" : "Copy file contents"}
      className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-zinc-950"
      onClick={handleCopy}
      type="button"
    >
      {copied ? (
        <Check aria-hidden="true" className="h-4 w-4 text-emerald-300" />
      ) : (
        <Copy aria-hidden="true" className="h-4 w-4" />
      )}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}
