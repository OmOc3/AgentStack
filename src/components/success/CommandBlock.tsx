import { CopyCommandButton } from "./CopyCommandButton";

export type CommandBlockProps = {
  command: string;
  label?: string | undefined;
  className?: string | undefined;
  copyLabel?: string | undefined;
};

export function CommandBlock({
  command,
  label = "Command",
  className,
  copyLabel = "Copy",
}: CommandBlockProps) {
  if (!command) {
    return null;
  }

  return (
    <div
      className={[
        "grid min-w-0 gap-2 rounded-lg border border-zinc-800 bg-zinc-950 p-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <code
        aria-label={label}
        className="block min-w-0 max-w-full overflow-x-auto whitespace-pre-wrap break-words px-2 py-1 font-mono text-xs leading-5 text-zinc-100"
      >
        {command}
      </code>
      <CopyCommandButton ariaLabel={`Copy command: ${label}`} value={command}>
        {copyLabel}
      </CopyCommandButton>
    </div>
  );
}
