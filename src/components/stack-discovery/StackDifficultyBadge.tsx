import {
  stackDifficultyLabels,
  type StackDifficulty,
} from "@/lib/stack-discovery";

export type StackDifficultyBadgeProps = {
  difficulty: StackDifficulty;
  className?: string;
};

const difficultyClassNames: Record<StackDifficulty, string> = {
  advanced: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  beginner: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  intermediate: "border-sky-400/30 bg-sky-400/10 text-sky-200",
};

export function StackDifficultyBadge({
  difficulty,
  className,
}: StackDifficultyBadgeProps) {
  return (
    <span
      className={joinClassNames(
        "inline-flex h-7 items-center rounded-full border px-2.5 text-xs font-medium",
        difficultyClassNames[difficulty],
        className,
      )}
    >
      {stackDifficultyLabels[difficulty]}
    </span>
  );
}

function joinClassNames(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(" ");
}
