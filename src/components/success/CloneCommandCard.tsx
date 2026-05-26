import { AlertTriangle, GitBranch } from "lucide-react";

import { getCloneCommand } from "@/lib/success";

import { CommandBlock } from "./CommandBlock";

export type CloneCommandCardProps = {
  repoUrl?: string | null | undefined;
  title?: string | undefined;
  description?: string | undefined;
  className?: string | undefined;
};

export function CloneCommandCard({
  repoUrl,
  title = "Clone the repo",
  description = "Copy this into a terminal from the folder where you keep projects.",
  className,
}: CloneCommandCardProps) {
  const cloneCommand = getCloneCommand(repoUrl);
  const hasRepoUrl = Boolean(repoUrl?.trim());

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
          <GitBranch aria-hidden="true" className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight text-zinc-100">
            {title}
          </h2>
          <p className="mt-1 text-sm leading-6 text-zinc-300">{description}</p>
        </div>
      </div>

      {cloneCommand ? (
        <CommandBlock
          className="mt-5"
          command={cloneCommand}
          copyLabel="Copy command"
          label="Clone command"
        />
      ) : (
        <div className="mt-5 flex gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm leading-6 text-amber-100">
          <AlertTriangle
            aria-hidden="true"
            className="mt-0.5 h-4 w-4 shrink-0"
          />
          <p>
            {hasRepoUrl
              ? "The repo URL has spaces or control characters, so AgentStack will not build a shell command from it."
              : "Add a repo URL to show the clone command."}
          </p>
        </div>
      )}
    </section>
  );
}
