import { ExternalLink, Github, TerminalSquare } from "lucide-react";

import { getOpenInToolHints, type OpenInToolHint } from "@/lib/success";

import { CommandBlock } from "./CommandBlock";

export type OpenInToolsPanelProps = {
  repoUrl?: string | null | undefined;
  hints?: readonly OpenInToolHint[] | undefined;
  title?: string | undefined;
  className?: string | undefined;
};

export function OpenInToolsPanel({
  repoUrl,
  hints,
  title = "Open in your tools",
  className,
}: OpenInToolsPanelProps) {
  const toolHints = hints ?? getOpenInToolHints(repoUrl);

  return (
    <section
      className={[
        "rounded-lg border border-zinc-800 bg-zinc-900/70 p-5 shadow-2xl shadow-purple-950/10 sm:p-6",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-zinc-100">
          {title}
        </h2>
        <p className="mt-1 text-sm leading-6 text-zinc-300">
          Use the repo in GitHub, Cursor, Claude Code, or Windsurf.
        </p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {toolHints.map((hint) => (
          <article
            className="min-w-0 rounded-lg border border-zinc-800 bg-zinc-950/70 p-4"
            key={hint.id}
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-zinc-700 text-zinc-200">
                {hint.id === "github" ? (
                  <Github aria-hidden="true" className="h-4 w-4" />
                ) : (
                  <TerminalSquare aria-hidden="true" className="h-4 w-4" />
                )}
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-medium text-zinc-100">
                  {hint.label}
                </h3>
                <p className="mt-1 text-sm leading-6 text-zinc-400">
                  {hint.description}
                </p>
              </div>
            </div>

            {hint.href ? (
              <a
                className="mt-4 inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-zinc-950"
                href={hint.href}
                rel="noreferrer"
                target="_blank"
              >
                Open
                <ExternalLink aria-hidden="true" className="h-4 w-4" />
              </a>
            ) : hint.command ? (
              <CommandBlock
                className="mt-4"
                command={hint.command}
                label={`${hint.label} command`}
              />
            ) : (
              <p className="mt-4 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm leading-6 text-amber-100">
                {hint.disabledReason ?? "This tool is not available yet."}
              </p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
