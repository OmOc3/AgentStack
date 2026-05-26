"use client";

import { Check } from "lucide-react";

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
  return (
    <button
      aria-pressed={isSelected}
      className={`group flex h-full min-h-32 w-full items-start gap-4 rounded-lg border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-zinc-950 ${
        isSelected
          ? "border-purple-500 bg-purple-500/10"
          : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-900"
      }`}
      onClick={() => onSelect(stack.id)}
      type="button"
    >
      <StackIcon icon={stack.icon} />
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-3">
          <span className="font-medium text-zinc-100">{stack.name}</span>
          <span
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
              isSelected
                ? "border-purple-400 bg-purple-500 text-white"
                : "border-zinc-700 text-transparent"
            }`}
          >
            <Check aria-hidden="true" className="h-3.5 w-3.5" />
          </span>
        </span>
        <span className="mt-2 block text-sm leading-6 text-zinc-400">
          {stack.description}
        </span>
      </span>
    </button>
  );
}
