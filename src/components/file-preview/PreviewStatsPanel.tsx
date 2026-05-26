"use client";

import { BarChart3 } from "lucide-react";

import {
  getPreviewStats,
  previewFileFilterLabels,
  type PreviewFileFilter,
  type PreviewFileType,
  type PreviewGeneratedFile,
} from "@/lib/file-preview";

import { joinClasses } from "./styles";

type PreviewStatsPanelProps = {
  files: readonly PreviewGeneratedFile[];
  activeFilter?: PreviewFileFilter;
  className?: string;
  onFilterChange?: (filter: PreviewFileFilter) => void;
};

const previewTypeOrder: PreviewFileType[] = [
  "agent",
  "app",
  "config",
  "docs",
  "env",
];

export function PreviewStatsPanel({
  files,
  activeFilter = "all",
  className,
  onFilterChange,
}: PreviewStatsPanelProps) {
  const stats = getPreviewStats(files);

  return (
    <section
      aria-label="Preview summary"
      className={joinClasses(
        "rounded-lg border border-zinc-800 bg-zinc-950 p-4",
        className,
      )}
    >
      <div className="flex items-center gap-2 text-sm font-medium text-zinc-100">
        <BarChart3 aria-hidden="true" className="h-4 w-4 text-purple-300" />
        Preview summary
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatItem label="Files" value={formatNumber(stats.totalFiles)} />
        <StatItem label="Key files" value={formatNumber(stats.keyFiles)} />
        <StatItem label="Lines" value={formatNumber(stats.totalLines)} />
        <StatItem
          label="Characters"
          value={formatNumber(stats.totalCharacters)}
        />
      </dl>

      <div className="mt-4 flex flex-wrap gap-2" aria-label="Files by type">
        {previewTypeOrder.map((type) => {
          const typeStats = stats.byType[type];
          const label = previewFileFilterLabels[type];
          const isActive = activeFilter === type;
          const content = (
            <>
              <span>{label}</span>
              <span className="font-mono text-[11px] text-zinc-400">
                {formatNumber(typeStats.count)}
              </span>
            </>
          );

          if (!onFilterChange) {
            return (
              <div
                className="inline-flex min-h-9 items-center gap-2 rounded-md border border-zinc-800 px-3 text-xs font-medium text-zinc-300"
                key={type}
              >
                {content}
              </div>
            );
          }

          return (
            <button
              aria-label={`${label}: ${formatNumber(typeStats.count)} files`}
              aria-pressed={isActive}
              className={joinClasses(
                "inline-flex min-h-9 items-center gap-2 rounded-md border px-3 text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-zinc-950",
                isActive
                  ? "border-purple-500/70 bg-purple-500/15 text-purple-100"
                  : "border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900",
              )}
              key={type}
              onClick={() => onFilterChange(type)}
              type="button"
            >
              {content}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md border border-zinc-800 bg-zinc-900/70 p-3">
      <dt className="text-xs text-zinc-400">{label}</dt>
      <dd className="mt-1 truncate font-mono text-sm font-semibold text-zinc-100">
        {value}
      </dd>
    </div>
  );
}

function formatNumber(value: number) {
  return value.toLocaleString("en-US");
}
