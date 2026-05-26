"use client";

import { Search, X } from "lucide-react";
import { type ChangeEventHandler, useId } from "react";

export type StackSearchInputProps = {
  value: string;
  onQueryChange: (query: string) => void;
  id?: string;
  label?: string;
  placeholder?: string;
  resultCount?: number;
  disabled?: boolean;
  className?: string;
};

export function StackSearchInput({
  value,
  onQueryChange,
  id,
  label = "Search stacks",
  placeholder = "Search by stack, tool, or use case",
  resultCount,
  disabled = false,
  className,
}: StackSearchInputProps) {
  const generatedId = useId();
  const inputId = id ?? `stack-search-${generatedId}`;
  const statusId = `${inputId}-status`;

  const handleChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    onQueryChange(event.target.value);
  };

  return (
    <div className={joinClassNames("w-full", className)}>
      <label className="text-sm font-medium text-zinc-100" htmlFor={inputId}>
        {label}
      </label>
      <div className="relative mt-2">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
        />
        <input
          aria-describedby={resultCount === undefined ? undefined : statusId}
          autoComplete="off"
          className="h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 py-2 pl-10 pr-11 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 focus-visible:ring-2 focus-visible:ring-purple-400 disabled:cursor-not-allowed disabled:border-zinc-800 disabled:bg-zinc-900 disabled:text-zinc-500"
          disabled={disabled}
          id={inputId}
          onChange={handleChange}
          placeholder={placeholder}
          type="search"
          value={value}
        />
        {value ? (
          <button
            aria-label="Clear stack search"
            className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:cursor-not-allowed disabled:text-zinc-600"
            disabled={disabled}
            onClick={() => onQueryChange("")}
            type="button"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      {resultCount === undefined ? null : (
        <p
          aria-live="polite"
          className="mt-2 text-sm text-zinc-400"
          id={statusId}
        >
          {formatResultCount(resultCount)}
        </p>
      )}
    </div>
  );
}

function formatResultCount(resultCount: number) {
  if (resultCount === 0) {
    return "No stacks found.";
  }

  if (resultCount === 1) {
    return "1 stack found.";
  }

  return `${resultCount} stacks found.`;
}

function joinClassNames(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(" ");
}
