import { AlertTriangle, CheckCircle2, Circle } from "lucide-react";

export type NextStepState = "todo" | "done" | "blocked";

export type NextStepItem = {
  id: string;
  label: string;
  description?: string | undefined;
  state?: NextStepState | undefined;
};

export type NextStepsChecklistProps = {
  repoUrl?: string | null | undefined;
  stackId?: string | null | undefined;
  items?: readonly NextStepItem[] | undefined;
  previewStatus?: "available" | "expired" | "missing" | undefined;
  title?: string | undefined;
  className?: string | undefined;
};

export function NextStepsChecklist({
  repoUrl,
  stackId,
  items,
  previewStatus = "missing",
  title = "Next steps",
  className,
}: NextStepsChecklistProps) {
  const checklistItems =
    items ?? getDefaultChecklistItems({ repoUrl, stackId, previewStatus });

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
          A short path from generated repo to first local run.
        </p>
      </div>

      <ol className="mt-5 space-y-4">
        {checklistItems.map((item) => (
          <li
            className="grid grid-cols-[auto,minmax(0,1fr)] gap-3"
            key={item.id}
          >
            <StepStateIcon state={item.state ?? "todo"} />
            <div className="min-w-0 border-b border-zinc-800 pb-4 last:border-b-0 last:pb-0">
              <h3 className="text-sm font-medium text-zinc-100">
                {item.label}
              </h3>
              {item.description ? (
                <p className="mt-1 text-sm leading-6 text-zinc-400">
                  {item.description}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function getDefaultChecklistItems({
  repoUrl,
  stackId,
  previewStatus,
}: {
  repoUrl?: string | null | undefined;
  stackId?: string | null | undefined;
  previewStatus: "available" | "expired" | "missing";
}): readonly NextStepItem[] {
  const hasRepoUrl = Boolean(repoUrl?.trim());
  const hasStackId = Boolean(stackId?.trim());
  const previewItem =
    previewStatus === "expired"
      ? [
          {
            id: "preview-expired",
            label: "Use GitHub for file review",
            description:
              "The temporary preview files may be gone, but the generated repo is still available.",
            state: "blocked" as const,
          },
        ]
      : [];

  return [
    {
      id: "clone",
      label: "Clone the repo",
      description: hasRepoUrl
        ? "Run the clone command before installing dependencies."
        : "Create a repo first so AgentStack can build the clone command.",
      state: hasRepoUrl ? "todo" : "blocked",
    },
    {
      id: "install",
      label: "Install dependencies",
      description: hasStackId
        ? "Use the install card, then start the dev server."
        : "Run npm install, then check package.json for stack-specific scripts.",
    },
    {
      id: "env",
      label: "Add environment values",
      description:
        "Copy the sample env file and fill in any provider keys before the first run.",
    },
    {
      id: "agent-context",
      label: "Read the agent instructions",
      description:
        "Start with CLAUDE.md or AGENT.md before asking a coding agent to change files.",
    },
    {
      id: "open-tool",
      label: "Open the project in your tool",
      description:
        "Cursor, Claude Code, and Windsurf all work from the cloned folder.",
    },
    ...previewItem,
  ];
}

function StepStateIcon({ state }: { state: NextStepState }) {
  if (state === "done") {
    return (
      <CheckCircle2
        aria-label="Done"
        className="mt-0.5 h-5 w-5 text-emerald-300"
      />
    );
  }

  if (state === "blocked") {
    return (
      <AlertTriangle
        aria-label="Needs attention"
        className="mt-0.5 h-5 w-5 text-amber-300"
      />
    );
  }

  return <Circle aria-label="To do" className="mt-0.5 h-5 w-5 text-zinc-500" />;
}
