"use client";

import {
  filterPreviewFiles,
  previewFileFilterLabels,
  previewFileFilters,
  type PreviewFileFilter,
  type PreviewGeneratedFile,
} from "@/lib/file-preview";

import { joinClasses } from "./styles";

type PreviewFileFiltersProps = {
  files: readonly PreviewGeneratedFile[];
  value: PreviewFileFilter;
  className?: string;
  disabled?: boolean;
  onChange: (filter: PreviewFileFilter) => void;
};

export function PreviewFileFilters({
  files,
  value,
  className,
  disabled = false,
  onChange,
}: PreviewFileFiltersProps) {
  return (
    <fieldset
      className={joinClasses("min-w-0", className)}
      disabled={disabled}
    >
      <legend className="sr-only">Filter preview files</legend>
      <div className="flex flex-wrap gap-2" aria-label="Preview file filters">
        {previewFileFilters.map((filter) => {
          const count = filterPreviewFiles(files, filter).length;
          const label = previewFileFilterLabels[filter];
          const isActive = value === filter;
          const isDisabled = disabled || (filter !== "all" && count === 0);

          return (
            <button
              aria-label={`${label}: ${formatNumber(count)} files`}
              aria-pressed={isActive}
              className={joinClasses(
                "inline-flex min-h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:cursor-not-allowed disabled:border-zinc-800 disabled:text-zinc-600",
                isActive
                  ? "border-purple-500/70 bg-purple-500/15 text-purple-100"
                  : "border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900",
              )}
              disabled={isDisabled}
              key={filter}
              onClick={() => onChange(filter)}
              type="button"
            >
              <span>{label}</span>
              <span className="font-mono text-xs text-zinc-400">
                {formatNumber(count)}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function formatNumber(value: number) {
  return value.toLocaleString("en-US");
}
