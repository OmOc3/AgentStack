export const stackCategories = [
  "frontend",
  "full-stack",
  "backend",
  "database",
  "mobile",
  "ai",
  "tooling",
] as const;

export type StackCategory = (typeof stackCategories)[number];

export const stackCategoryLabels: Record<StackCategory, string> = {
  ai: "AI",
  backend: "Backend",
  database: "Database",
  frontend: "Frontend",
  "full-stack": "Full stack",
  mobile: "Mobile",
  tooling: "Tooling",
};

export const stackDifficulties = [
  "beginner",
  "intermediate",
  "advanced",
] as const;

export type StackDifficulty = (typeof stackDifficulties)[number];

export const stackDifficultyLabels: Record<StackDifficulty, string> = {
  advanced: "Advanced",
  beginner: "Beginner",
  intermediate: "Intermediate",
};

export type StackDiscoveryMetadata = {
  category: StackCategory;
  difficulty: StackDifficulty;
  tags: readonly string[];
  aliases?: readonly string[];
  recommendedFor?: readonly string[];
  searchKeywords?: readonly string[];
  recommendationWeight?: number;
};

export type StackDiscoveryItem = {
  id: string;
  name: string;
  description: string;
  metadata: StackDiscoveryMetadata;
};

export type StackCategoryFilterValue = StackCategory | "all";
export type StackDifficultyFilterValue = StackDifficulty | "all";
