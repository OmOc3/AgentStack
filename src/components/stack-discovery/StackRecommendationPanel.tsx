"use client";

import { Lightbulb } from "lucide-react";

import { StackIcon } from "@/components/StackIcon";
import { StackDifficultyBadge } from "@/components/stack-discovery/StackDifficultyBadge";
import { StackTags } from "@/components/stack-discovery/StackTags";
import {
  stackCategoryLabels,
  stackDifficultyLabels,
  type StackDiscoveryDefinition,
} from "@/lib/stack-discovery";
import type { StackId } from "@/lib/stacks";

export type StackRecommendationPanelProps = {
  hasIntent: boolean;
  recommendations: readonly StackDiscoveryDefinition[];
  selectedStack: StackId | null;
  onSelect: (stackId: StackId) => void;
};

export function StackRecommendationPanel({
  hasIntent,
  recommendations,
  selectedStack,
  onSelect,
}: StackRecommendationPanelProps) {
  if (recommendations.length === 0) {
    return null;
  }

  return (
    <section className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/60">
      <div className="flex items-start gap-3 border-b border-zinc-800 p-5 sm:p-6">
        <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-200">
          <Lightbulb aria-hidden="true" className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">
            {hasIntent ? "Suggested from your brief" : "Good starting points"}
          </h2>
          <p className="mt-1 text-sm leading-6 text-zinc-300">
            {hasIntent
              ? "These picks use the project name, description, and brief."
              : "Add a project brief to make these picks more specific."}
          </p>
        </div>
      </div>

      <div className="divide-y divide-zinc-800">
        {recommendations.map((stack) => {
          const isSelected = selectedStack === stack.id;

          return (
            <button
              aria-label={`Choose ${stack.name}`}
              aria-pressed={isSelected}
              className={`grid w-full gap-4 p-5 text-left transition focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-400 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:p-6 ${
                isSelected
                  ? "bg-purple-500/10"
                  : "hover:bg-zinc-900 focus:bg-zinc-900"
              }`}
              key={stack.id}
              onClick={() => onSelect(stack.id)}
              type="button"
            >
              <StackIcon icon={stack.icon} />
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-zinc-100">
                    {stack.name}
                  </span>
                  <StackDifficultyBadge
                    difficulty={stack.metadata.difficulty}
                  />
                </span>
                <span className="mt-2 block text-sm leading-6 text-zinc-300">
                  {getRecommendationReason(stack, hasIntent)}
                </span>
                <StackTags
                  className="mt-3"
                  maxVisible={3}
                  tags={stack.metadata.tags}
                />
              </span>
              <span
                className={`inline-flex min-h-9 w-fit items-center justify-center rounded-lg border px-3 py-1.5 text-sm font-medium ${
                  isSelected
                    ? "border-purple-400/60 bg-purple-500/15 text-purple-100"
                    : "border-zinc-700 text-zinc-200"
                }`}
              >
                {isSelected ? "Selected" : "Use this"}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function getRecommendationReason(
  stack: StackDiscoveryDefinition,
  hasIntent: boolean,
) {
  const useCases = stack.metadata.recommendedFor?.slice(0, 2) ?? [];

  if (useCases.length > 0) {
    return hasIntent
      ? `Fits ${formatShortList(useCases)}.`
      : `Common pick for ${formatShortList(useCases)}.`;
  }

  return `${stackCategoryLabels[stack.metadata.category]} starter, ${stackDifficultyLabels[
    stack.metadata.difficulty
  ].toLowerCase()} setup.`;
}

function formatShortList(values: readonly string[]) {
  if (values.length <= 1) {
    return values[0] ?? "this use case";
  }

  return `${values[0]} and ${values[1]}`;
}
