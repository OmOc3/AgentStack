import type {
  StackDiscoveryItem,
  StackDiscoveryMetadata,
} from "./types";
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
  "next-saas-starter": {
    category: "full-stack",
    difficulty: "advanced",
    tags: ["Next.js", "Prisma", "PostgreSQL", "NextAuth"],
    recommendedFor: ["SaaS apps", "dashboards", "workspace products"],
    searchKeywords: ["auth", "billing-ready", "database"],
    recommendationWeight: 7,
  },
  "ai-chatbot-starter": {
    category: "ai",
    difficulty: "intermediate",
    tags: ["Next.js", "AI", "Chat", "Tailwind"],
    recommendedFor: ["chatbots", "support tools", "AI prototypes"],
    searchKeywords: ["model provider", "conversation"],
    recommendationWeight: 8,
  },
  "marketing-content-starter": {
    category: "frontend",
    difficulty: "beginner",
    tags: ["Next.js", "Marketing", "SEO", "Content"],
    recommendedFor: ["landing pages", "blogs", "content sites"],
    searchKeywords: ["sitemap", "robots", "metadata"],
    recommendationWeight: 7,
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
