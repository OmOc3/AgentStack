export type StackTagsProps = {
  tags: readonly string[];
  maxVisible?: number;
  label?: string;
  className?: string;
};

export function StackTags({
  tags,
  maxVisible = tags.length,
  label = "Stack tags",
  className,
}: StackTagsProps) {
  if (tags.length === 0) {
    return null;
  }

  const visibleCount = Math.max(0, Math.floor(maxVisible));
  const visibleTags = tags.slice(0, visibleCount);
  const hiddenCount = tags.length - visibleTags.length;

  return (
    <ul
      aria-label={label}
      className={joinClassNames("flex flex-wrap gap-2", className)}
    >
      {visibleTags.map((tag) => (
        <li key={tag}>
          <span className="inline-flex h-7 items-center rounded-full border border-zinc-800 bg-zinc-950/50 px-2.5 text-xs font-medium text-zinc-300">
            {tag}
          </span>
        </li>
      ))}
      {hiddenCount > 0 ? (
        <li>
          <span
            aria-label={`${hiddenCount} more tags`}
            className="inline-flex h-7 items-center rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 text-xs font-medium text-purple-200"
          >
            +{hiddenCount}
          </span>
        </li>
      ) : null}
    </ul>
  );
}

function joinClassNames(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(" ");
}
