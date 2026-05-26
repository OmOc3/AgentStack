# Stack discovery integration

This package is isolated for now. It does not change `stackDefinitions`,
`GenerateForm`, or `StackCard`.

## 1. Add discovery metadata next to the future integration

Keep the metadata outside `src/lib/stacks.ts` until the stack source is ready to
own discovery fields.

```ts
import type {
  StackDiscoveryItem,
  StackDiscoveryMetadata,
} from "@/lib/stack-discovery";
import type { StackDefinition } from "@/lib/stacks";

const stackDiscoveryMetadata = {
  "next-tailwind": {
    category: "frontend",
    difficulty: "beginner",
    tags: ["Next.js", "Tailwind", "TypeScript"],
    recommendedFor: ["landing pages", "dashboards", "fast web apps"],
    searchKeywords: ["app router", "starter"],
    recommendationWeight: 10,
  },
  "next-supabase": {
    category: "full-stack",
    difficulty: "intermediate",
    tags: ["Next.js", "Supabase", "Auth", "Postgres"],
    recommendedFor: ["auth", "database-backed apps", "SaaS"],
    recommendationWeight: 9,
  },
  "next-firebase": {
    category: "full-stack",
    difficulty: "intermediate",
    tags: ["Next.js", "Firebase", "Auth"],
    recommendedFor: ["real-time apps", "Google Cloud", "prototypes"],
    recommendationWeight: 8,
  },
  "next-drizzle": {
    category: "database",
    difficulty: "advanced",
    tags: ["Next.js", "Drizzle", "Neon", "Postgres"],
    recommendedFor: ["typed SQL", "schema-first apps"],
    recommendationWeight: 7,
  },
  "expo-firebase": {
    category: "mobile",
    difficulty: "intermediate",
    tags: ["Expo", "Firebase", "React Native"],
    recommendedFor: ["mobile apps", "push-ready prototypes"],
    recommendationWeight: 8,
  },
  "t3-stack": {
    category: "full-stack",
    difficulty: "advanced",
    tags: ["Next.js", "tRPC", "Prisma", "NextAuth"],
    recommendedFor: ["type-safe APIs", "full-stack TypeScript"],
    recommendationWeight: 7,
  },
  "next-prisma": {
    category: "database",
    difficulty: "intermediate",
    tags: ["Next.js", "Prisma", "PostgreSQL"],
    recommendedFor: ["relational data", "CRUD apps"],
    recommendationWeight: 8,
  },
  "sveltekit-tailwind": {
    category: "frontend",
    difficulty: "beginner",
    tags: ["SvelteKit", "Tailwind", "TypeScript"],
    recommendedFor: ["lean web apps", "Svelte teams"],
    recommendationWeight: 6,
  },
  "remix-tailwind": {
    category: "frontend",
    difficulty: "intermediate",
    tags: ["Remix", "Tailwind", "TypeScript"],
    recommendedFor: ["nested routes", "web fundamentals"],
    recommendationWeight: 6,
  },
  "astro-tailwind": {
    category: "frontend",
    difficulty: "beginner",
    tags: ["Astro", "Tailwind"],
    recommendedFor: ["content sites", "marketing sites"],
    recommendationWeight: 6,
  },
} satisfies Record<StackDefinition["id"], StackDiscoveryMetadata>;

export type StackDiscoveryDefinition = StackDefinition & StackDiscoveryItem;

export function toStackDiscoveryItems(
  stacks: readonly StackDefinition[],
): StackDiscoveryDefinition[] {
  return stacks.map((stack) => ({
    ...stack,
    metadata: stackDiscoveryMetadata[stack.id],
  }));
}
```

## 2. Add local discovery state in `GenerateForm`

When `GenerateForm` is ready to change, keep the filters controlled in that
component and derive the visible stack list with pure utilities.

```tsx
import { useMemo, useState } from "react";

import {
  filterStacksByCategory,
  filterStacksByDifficulty,
  searchStacks,
  type StackCategoryFilterValue,
  type StackDifficultyFilterValue,
} from "@/lib/stack-discovery";
import {
  StackCategoryFilter,
  StackSearchInput,
} from "@/components/stack-discovery";
import { toStackDiscoveryItems } from "@/lib/stack-discovery/metadata";

const [stackQuery, setStackQuery] = useState("");
const [stackCategory, setStackCategory] =
  useState<StackCategoryFilterValue>("all");
const [stackDifficulty, setStackDifficulty] =
  useState<StackDifficultyFilterValue>("all");

const discoveryStacks = useMemo(() => toStackDiscoveryItems(stacks), [stacks]);
const visibleStacks = useMemo(() => {
  const byCategory = filterStacksByCategory(discoveryStacks, stackCategory);
  const byDifficulty = filterStacksByDifficulty(byCategory, stackDifficulty);

  return searchStacks(byDifficulty, stackQuery);
}, [discoveryStacks, stackCategory, stackDifficulty, stackQuery]);
```

Render the controls above the stack radio group:

```tsx
<div className="grid gap-4 rounded-lg border border-zinc-800 bg-zinc-900/60 p-5 sm:p-6 lg:grid-cols-[1fr_auto]">
  <StackSearchInput
    onQueryChange={setStackQuery}
    resultCount={visibleStacks.length}
    value={stackQuery}
  />
  <StackCategoryFilter
    onCategoryChange={setStackCategory}
    selectedCategory={stackCategory}
  />
</div>
```

Then map `visibleStacks` into `StackCard`. Each item still has the original
`StackDefinition` fields, so the current `StackCard` props do not need to
change.

## 3. Recommendation hook-in

Use recommendations where the product has enough intent text, for example after
the project description field exists.

```ts
import { getRecommendedStacks } from "@/lib/stack-discovery";

const recommendedStacks = getRecommendedStacks(
  discoveryStacks,
  projectDescription,
);
```

Do not auto-select a recommendation. Show it as a hint or sort boost so the user
keeps control of the stack choice.

## Notes

- If filters hide the selected stack, keep the selection until the user chooses
  another stack. Clearing it on every filter change would make preview state feel
  unstable.
- The utilities are pure and keep input order for equal scores, so they can be
  unit tested without React or Next.js.
