import { ExternalLink, FileText, Info } from "lucide-react";

import { getOpenInToolHints, getSuccessStackName } from "@/lib/success";

export type PreviewStatus = "available" | "expired" | "missing";

export type GeneratedRepoFileStat = {
  path: string;
  sizeBytes?: number | undefined;
};

export type GeneratedRepoFileStats = {
  fileCount?: number | undefined;
  totalBytes?: number | undefined;
  files?: readonly GeneratedRepoFileStat[] | undefined;
  previewStatus?: PreviewStatus | undefined;
};

export type GeneratedRepoSummaryProps = {
  repoUrl?: string | null | undefined;
  stackId?: string | null | undefined;
  stackName?: string | undefined;
  fileStats?: GeneratedRepoFileStats | null | undefined;
  includedFiles?: readonly string[] | undefined;
  title?: string | undefined;
  className?: string | undefined;
};

const defaultIncludedFiles = [
  "CLAUDE.md",
  "AGENT.md",
  ".cursorrules",
  ".windsurfrules",
] as const;

export function GeneratedRepoSummary({
  repoUrl,
  stackId,
  stackName,
  fileStats,
  includedFiles = defaultIncludedFiles,
  title = "Repo summary",
  className,
}: GeneratedRepoSummaryProps) {
  const files = fileStats?.files ?? [];
  const visibleFiles = files.slice(0, 6);
  const fileCount = fileStats?.fileCount ?? files.length;
  const remainingFileCount = Math.max(0, fileCount - visibleFiles.length);
  const totalBytes = formatBytes(fileStats?.totalBytes);
  const previewStatus = fileStats?.previewStatus ?? "missing";
  const resolvedStackName =
    stackName ?? (stackId ? getSuccessStackName(stackId) : null);
  const githubHref = getOpenInToolHints(repoUrl).find(
    (hint) => hint.id === "github" && hint.href,
  )?.href;

  return (
    <section
      className={[
        "rounded-lg border border-zinc-800 bg-zinc-900/70 p-5 shadow-2xl shadow-purple-950/10 sm:p-6",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-200">
          <FileText aria-hidden="true" className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight text-zinc-100">
            {title}
          </h2>
          <p className="mt-1 text-sm leading-6 text-zinc-300">
            The useful bits to check before opening the project locally.
          </p>
        </div>
      </div>

      <dl className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="min-w-0 rounded-lg border border-zinc-800 bg-zinc-950/70 p-4">
          <dt className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
            Repository
          </dt>
          <dd className="mt-2 min-w-0 text-sm font-medium text-zinc-100">
            {repoUrl ? (
              githubHref ? (
                <a
                  className="inline-flex max-w-full items-center gap-2 rounded text-purple-200 transition hover:text-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-zinc-950"
                  href={githubHref}
                  rel="noreferrer"
                  target="_blank"
                >
                  <span className="truncate">{repoUrl}</span>
                  <ExternalLink
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0"
                  />
                </a>
              ) : (
                <span className="block truncate" title={repoUrl}>
                  {repoUrl}
                </span>
              )
            ) : (
              <span className="text-zinc-400">Waiting for repo URL</span>
            )}
          </dd>
        </div>

        <div className="min-w-0 rounded-lg border border-zinc-800 bg-zinc-950/70 p-4">
          <dt className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
            Stack
          </dt>
          <dd className="mt-2 text-sm font-medium text-zinc-100">
            {resolvedStackName ?? (
              <span className="text-zinc-400">Not passed yet</span>
            )}
          </dd>
        </div>

        <div className="min-w-0 rounded-lg border border-zinc-800 bg-zinc-950/70 p-4">
          <dt className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
            Files
          </dt>
          <dd className="mt-2 text-sm font-medium text-zinc-100">
            {fileCount > 0
              ? `${fileCount} files`
              : getPreviewFallback(previewStatus)}
            {totalBytes ? (
              <span className="ml-2 text-xs font-normal text-zinc-500">
                {totalBytes}
              </span>
            ) : null}
          </dd>
        </div>
      </dl>

      <div className="mt-5">
        <h3 className="text-sm font-medium text-zinc-100">
          Agent context included
        </h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {includedFiles.map((file) => (
            <span
              className="rounded border border-purple-500/30 bg-purple-500/10 px-2 py-1 font-mono text-xs text-purple-200"
              key={file}
            >
              {file}
            </span>
          ))}
        </div>
      </div>

      {visibleFiles.length > 0 ? (
        <div className="mt-5 rounded-lg border border-zinc-800 bg-zinc-950/70">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <h3 className="text-sm font-medium text-zinc-100">
              Generated files
            </h3>
            {remainingFileCount > 0 ? (
              <span className="text-xs text-zinc-400">
                +{remainingFileCount} more
              </span>
            ) : null}
          </div>
          <ul className="divide-y divide-zinc-800 border-t border-zinc-800">
            {visibleFiles.map((file) => (
              <li className="px-4 py-3" key={file.path}>
                <code className="break-all font-mono text-xs text-zinc-300">
                  {file.path}
                </code>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-5 flex gap-2 rounded-lg border border-zinc-800 bg-zinc-950/70 p-4 text-sm leading-6 text-zinc-400">
          <Info
            aria-hidden="true"
            className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500"
          />
          <span>{getPreviewMessage(previewStatus)}</span>
        </p>
      )}
    </section>
  );
}

function getPreviewFallback(previewStatus: PreviewStatus) {
  if (previewStatus === "expired") {
    return "Preview expired";
  }

  return "Not available";
}

function getPreviewMessage(previewStatus: PreviewStatus) {
  if (previewStatus === "expired") {
    return "File preview expired. Open the repo in GitHub to inspect the current files.";
  }

  return "File preview is not loaded yet. The repo link and setup commands still work.";
}

function formatBytes(value?: number) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return null;
  }

  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}
