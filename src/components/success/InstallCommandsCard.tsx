import { Info, Package } from "lucide-react";

import { getInstallCommandsForStack, type InstallCommand } from "@/lib/success";

import { CommandBlock } from "./CommandBlock";

export type InstallCommandsCardProps = {
  stackId?: string | null | undefined;
  commands?: readonly InstallCommand[] | undefined;
  title?: string | undefined;
  note?: string | undefined;
  className?: string | undefined;
};

export function InstallCommandsCard({
  stackId,
  commands,
  title = "Install and run",
  note,
  className,
}: InstallCommandsCardProps) {
  const commandGroup = getInstallCommandsForStack(stackId);
  const installCommands = commands ?? commandGroup.commands;
  const noteText = note ?? commandGroup.note;

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
          <Package aria-hidden="true" className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight text-zinc-100">
            {title}
          </h2>
          <p className="mt-1 text-sm leading-6 text-zinc-300">
            {commandGroup.hasStackSpecificCommands
              ? `${commandGroup.stackName} setup, based on the generated package.json.`
              : "Basic setup commands. Check package.json for anything stack-specific."}
          </p>
        </div>
      </div>

      <ol className="mt-5 divide-y divide-zinc-800 rounded-lg border border-zinc-800 bg-zinc-950/70">
        {installCommands.map((command) => (
          <li className="p-4" key={`${command.label}:${command.command}`}>
            <div>
              <h3 className="text-sm font-medium text-zinc-100">
                {command.label}
              </h3>
              {command.description ? (
                <p className="mt-1 text-sm leading-6 text-zinc-400">
                  {command.description}
                </p>
              ) : null}
            </div>
            <CommandBlock
              className="mt-3"
              command={command.command}
              label={command.label}
            />
          </li>
        ))}
      </ol>

      <p className="mt-4 flex gap-2 text-sm leading-6 text-zinc-400">
        <Info
          aria-hidden="true"
          className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500"
        />
        <span>{noteText}</span>
      </p>
    </section>
  );
}
