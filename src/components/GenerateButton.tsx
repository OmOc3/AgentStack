import { ArrowRight } from "lucide-react";

export function GenerateButton({
  disabled,
  disabledReason = "Complete the generator steps before creating the repo.",
  isLoading = false,
}: {
  disabled: boolean;
  disabledReason?: string;
  isLoading?: boolean;
}) {
  return (
    <button
      aria-disabled={disabled ? "true" : undefined}
      aria-label={disabled ? disabledReason : "Generate repo"}
      className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-purple-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
      disabled={disabled}
      type="submit"
    >
      Generate repo
      {!disabled && !isLoading ? (
        <ArrowRight
          aria-hidden="true"
          className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5"
        />
      ) : null}
    </button>
  );
}
