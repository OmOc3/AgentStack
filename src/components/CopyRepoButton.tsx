"use client";

import { Check, Copy } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";

type CopyRepoButtonProps = {
  repoUrl: string;
  children?: ReactNode;
  className?: string;
  copiedLabel?: string;
};

export function CopyRepoButton({
  repoUrl,
  children = "Copy URL",
  className,
  copiedLabel = "Copied",
}: CopyRepoButtonProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const defaultAriaLabel =
    typeof children === "string" ? children : "Copy repository URL";

  async function handleCopy() {
    await navigator.clipboard.writeText(repoUrl);
    setCopied(true);

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => setCopied(false), 2000);
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
      aria-label={copied ? "Copied!" : defaultAriaLabel}
      className={[
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-zinc-950",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={handleCopy}
      type="button"
    >
      {copied ? (
        <Check aria-hidden="true" className="h-4 w-4 text-emerald-300" />
      ) : (
        <Copy aria-hidden="true" className="h-4 w-4" />
      )}
      {copied ? copiedLabel : children}
    </button>
  );
}
