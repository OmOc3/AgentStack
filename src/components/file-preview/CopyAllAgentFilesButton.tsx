"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  filterPreviewFiles,
  type PreviewGeneratedFile,
} from "@/lib/file-preview";

import { joinClasses } from "./styles";

type CopyState = "idle" | "copied" | "failed";

type CopyAllAgentFilesButtonProps = {
  files: readonly PreviewGeneratedFile[];
  className?: string;
  disabled?: boolean;
  onCopied?: (files: PreviewGeneratedFile[], text: string) => void;
  onCopyError?: (error: Error) => void;
};

export function CopyAllAgentFilesButton({
  files,
  className,
  disabled = false,
  onCopied,
  onCopyError,
}: CopyAllAgentFilesButtonProps) {
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const timeoutRef = useRef<number | null>(null);
  const agentFiles = useMemo(() => filterPreviewFiles(files, "agent"), [files]);
  const isDisabled = disabled || agentFiles.length === 0;

  async function handleCopy() {
    if (isDisabled) {
      return;
    }

    const text = formatFilesForCopy(agentFiles);

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard access is not available in this browser.");
      }

      await navigator.clipboard.writeText(text);
      onCopied?.(agentFiles, text);
      setCopyState("copied");
      resetCopyStateSoon();
    } catch (caughtError) {
      const error =
        caughtError instanceof Error
          ? caughtError
          : new Error("Could not copy agent files.");

      onCopyError?.(error);
      setCopyState("failed");
      resetCopyStateSoon();
    }
  }

  function resetCopyStateSoon() {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => setCopyState("idle"), 1800);
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const buttonLabel = getButtonLabel(copyState, agentFiles.length);

  return (
    <>
      <button
        aria-label={buttonLabel}
        className={joinClasses(
          "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:cursor-not-allowed disabled:border-zinc-800 disabled:text-zinc-600",
          className,
        )}
        disabled={isDisabled}
        onClick={handleCopy}
        type="button"
      >
        {copyState === "copied" ? (
          <Check aria-hidden="true" className="h-4 w-4 text-emerald-300" />
        ) : (
          <Copy aria-hidden="true" className="h-4 w-4" />
        )}
        {buttonLabel}
      </button>
      <span aria-live="polite" className="sr-only" role="status">
        {copyState === "failed" ? "Could not copy agent files." : buttonLabel}
      </span>
    </>
  );
}

function getButtonLabel(copyState: CopyState, fileCount: number) {
  if (fileCount === 0) {
    return "No agent files";
  }

  if (copyState === "copied") {
    return "Copied agent files";
  }

  if (copyState === "failed") {
    return "Copy failed";
  }

  return fileCount === 1 ? "Copy agent file" : "Copy agent files";
}

function formatFilesForCopy(files: readonly PreviewGeneratedFile[]) {
  return files
    .map((file) => `# ${file.path}\n\n${file.content.trimEnd()}`)
    .join("\n\n---\n\n");
}
