"use client";

import { useId } from "react";

import {
  stackCategories,
  stackCategoryLabels,
  type StackCategory,
  type StackCategoryFilterValue,
} from "@/lib/stack-discovery";

export type StackCategoryFilterProps = {
  selectedCategory: StackCategoryFilterValue;
  onCategoryChange: (category: StackCategoryFilterValue) => void;
  categories?: readonly StackCategory[];
  label?: string;
  includeAll?: boolean;
  counts?: Partial<Record<StackCategory, number>>;
  allCount?: number;
  disabled?: boolean;
  className?: string;
};

export function StackCategoryFilter({
  selectedCategory,
  onCategoryChange,
  categories = stackCategories,
  label = "Category",
  includeAll = true,
  counts,
  allCount,
  disabled = false,
  className,
}: StackCategoryFilterProps) {
  const generatedId = useId();
  const labelId = `stack-category-filter-${generatedId}`;
  const options: StackCategoryFilterValue[] = includeAll
    ? ["all", ...categories]
    : [...categories];

  return (
    <div className={joinClassNames("space-y-2", className)}>
      <p className="text-sm font-medium text-zinc-100" id={labelId}>
        {label}
      </p>
      <div
        aria-labelledby={labelId}
        className="flex flex-wrap gap-2"
        role="group"
      >
        {options.map((option) => {
          const isSelected = selectedCategory === option;
          const count = getOptionCount(option, counts, allCount);
          const optionLabel = getOptionLabel(option);

          return (
            <button
              aria-label={getOptionAriaLabel(optionLabel, count)}
              aria-pressed={isSelected}
              className={`inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:cursor-not-allowed disabled:border-zinc-800 disabled:bg-zinc-900 disabled:text-zinc-600 ${
                isSelected
                  ? "border-purple-500 bg-purple-500/15 text-purple-100"
                  : "border-zinc-800 bg-zinc-950/40 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900 hover:text-zinc-100"
              }`}
              disabled={disabled}
              key={option}
              onClick={() => onCategoryChange(option)}
              type="button"
            >
              <span>{optionLabel}</span>
              {count === undefined ? null : (
                <span
                  aria-hidden="true"
                  className="rounded-full bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-300"
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function getOptionLabel(option: StackCategoryFilterValue) {
  return option === "all" ? "All" : stackCategoryLabels[option];
}

function getOptionCount(
  option: StackCategoryFilterValue,
  counts: Partial<Record<StackCategory, number>> | undefined,
  allCount: number | undefined,
) {
  return option === "all" ? allCount : counts?.[option];
}

function getOptionAriaLabel(label: string, count: number | undefined) {
  return count === undefined ? label : `${label}, ${count} stacks`;
}

function joinClassNames(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(" ");
}
