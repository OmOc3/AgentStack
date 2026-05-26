"use client";

import { FileText } from "lucide-react";

import {
  getKeyFileLabel,
  getKeyFiles,
  type PreviewGeneratedFile,
} from "@/lib/file-preview";

import { joinClasses } from "./styles";

type KeyFilesListProps = {
  files: readonly PreviewGeneratedFile[];
  className?: string;
  emptyMessage?: string;
  maxItems?: number;
  selectedPath?: string;
  onSelectFile?: (file: PreviewGeneratedFile) => void;
};

export function KeyFilesList({
  files,
  className,
  emptyMessage = "No key files found yet.",
  maxItems = 8,
  selectedPath,
  onSelectFile,
}: KeyFilesListProps) {
  const keyFiles = getKeyFiles(files);
  const visibleFiles = keyFiles.slice(0, Math.max(0, maxItems));
  const hiddenCount = Math.max(0, keyFiles.length - visibleFiles.length);

  return (
    <section
      aria-label="Key files"
      className={joinClasses(
        "rounded-lg border border-zinc-800 bg-zinc-950 p-4",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-100">
          <FileText aria-hidden="true" className="h-4 w-4 text-purple-300" />
          Key files
        </div>
        <span className="shrink-0 font-mono text-xs text-zinc-400">
          {keyFiles.length.toLocaleString("en-US")}
        </span>
      </div>

      {visibleFiles.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {visibleFiles.map((file) => {
            const isActive = file.path === selectedPath;
            const content = (
              <>
                <span className="block break-all font-mono text-xs text-zinc-100">
                  {file.path}
                </span>
                <span className="mt-1 block text-xs text-zinc-400">
                  {getKeyFileLabel(file)} -{" "}
                  {file.content.length.toLocaleString("en-US")} chars
                </span>
              </>
            );

            return (
              <li key={file.path}>
                {onSelectFile ? (
                  <button
                    aria-current={isActive ? "true" : undefined}
                    className={joinClasses(
                      "w-full rounded-md border px-3 py-2 text-left transition focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-zinc-950",
                      isActive
                        ? "border-purple-500/70 bg-purple-500/15"
                        : "border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900",
                    )}
                    onClick={() => onSelectFile(file)}
                    type="button"
                  >
                    {content}
                  </button>
                ) : (
                  <div className="rounded-md border border-zinc-800 px-3 py-2">
                    {content}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-3 rounded-md border border-dashed border-zinc-800 px-3 py-4 text-sm text-zinc-400">
          {emptyMessage}
        </p>
      )}

      {hiddenCount > 0 ? (
        <p className="mt-3 text-xs text-zinc-400">
          {hiddenCount.toLocaleString("en-US")} more key files
        </p>
      ) : null}
    </section>
  );
}
