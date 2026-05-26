"use client";

import { CheckCircle2 } from "lucide-react";
import type { KeyboardEvent } from "react";

import { StackIcon } from "@/components/StackIcon";
import type { StackDefinition } from "@/lib/stacks";

export function StackCard({
  isSelected,
  onSelect,
  stack,
}: {
  isSelected: boolean;
  onSelect: (stackId: StackDefinition["id"]) => void;
  stack: StackDefinition;
}) {
  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== " " && event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    onSelect(stack.id);
  }

  return (
    <button
      aria-checked={isSelected}
      className={`group relative flex h-full min-h-32 w-full scale-100 transform items-start gap-4 rounded-lg border p-4 pr-10 text-left transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-zinc-950 ${
        isSelected
          ? "scale-[1.01] border-purple-500 bg-purple-500/10"
          : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-900"
      }`}
      onClick={() => onSelect(stack.id)}
      onKeyDown={handleKeyDown}
      role="radio"
      tabIndex={0}
      type="button"
    >
      <CheckCircle2
        aria-hidden="true"
        className={`absolute right-4 top-4 h-5 w-5 text-purple-300 transition-opacity duration-200 ${
          isSelected ? "opacity-100" : "opacity-0"
        }`}
      />
      <StackIcon icon={stack.icon} />
      <span className="min-w-0 flex-1">
        <span className="block">
          <span className="font-medium text-zinc-100">{stack.name}</span>
        </span>
        <span className="mt-2 block text-sm leading-6 text-zinc-300">
          {stack.description}
        </span>
      </span>
    </button>
  );
}
