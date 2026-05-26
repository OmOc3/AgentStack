import { Loader2 } from "lucide-react";

export function GenerateButton({
  disabled,
  isLoading,
}: {
  disabled: boolean;
  isLoading: boolean;
}) {
  return (
    <button
      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-purple-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
      disabled={disabled}
      type="submit"
    >
      {isLoading ? (
        <>
          <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
          Creating your repo...
        </>
      ) : (
        "Generate repo"
      )}
    </button>
  );
}
