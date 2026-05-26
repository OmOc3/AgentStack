"use client";

import { AlertCircle, Check, Copy } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

type CopyState = "idle" | "copied" | "failed";

export type CopyCommandButtonProps = {
  value: string;
  children?: ReactNode | undefined;
  className?: string | undefined;
  ariaLabel?: string | undefined;
  copiedLabel?: string | undefined;
  failedLabel?: string | undefined;
  disabled?: boolean | undefined;
};

export function CopyCommandButton({
  value,
  children = "Copy",
  className,
  ariaLabel = "Copy command",
  copiedLabel = "Copied",
  failedLabel = "Copy failed",
  disabled = false,
}: CopyCommandButtonProps) {
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const timeoutRef = useRef<number | null>(null);
  const isDisabled = disabled || value.length === 0;

  async function handleCopy() {
    if (isDisabled) {
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      setCopyState("idle");
    }, 1800);
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const label =
    copyState === "copied"
      ? copiedLabel
      : copyState === "failed"
        ? failedLabel
        : children;

  return (
    <button
      aria-label={copyState === "idle" ? ariaLabel : String(label)}
      className={[
        "inline-flex min-h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-zinc-950",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      disabled={isDisabled}
      onClick={handleCopy}
      type="button"
    >
      {copyState === "copied" ? (
        <Check aria-hidden="true" className="h-4 w-4 text-emerald-300" />
      ) : copyState === "failed" ? (
        <AlertCircle aria-hidden="true" className="h-4 w-4 text-amber-300" />
      ) : (
        <Copy aria-hidden="true" className="h-4 w-4" />
      )}
      {label}
    </button>
  );
}
