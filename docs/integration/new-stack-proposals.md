# New Stack Proposals

These stack templates are isolated under `src/lib/stack-proposals` and are not registered in the live app yet.

Proposed stacks:

- `next-saas-starter` - Next.js App Router, Tailwind, Prisma, PostgreSQL, and a NextAuth-ready structure.
- `ai-chatbot-starter` - Next.js App Router, Tailwind, a chat page, an API route, and a provider-neutral AI interface.
- `marketing-content-starter` - Next.js, Tailwind, SEO metadata, sitemap and robots routes, and a typed content placeholder.

## Later Registration Steps

Update `src/lib/stacks.ts` only when the team is ready to expose these stacks in the product.

1. Import the proposal definitions and builders:

```ts
import {
  stackProposalDefinitions,
  stackProposalFileBuilders,
} from "@/lib/stack-proposals";
```

2. Add the proposal IDs to `stackIds`:

```ts
export const stackIds = [
  "next-tailwind",
  "next-supabase",
  "next-firebase",
  "next-drizzle",
  "expo-firebase",
  "t3-stack",
  "next-prisma",
  "sveltekit-tailwind",
  "remix-tailwind",
  "astro-tailwind",
  "next-saas-starter",
  "ai-chatbot-starter",
  "marketing-content-starter",
] as const;
```

3. Append the definitions to `stackDefinitions`:

```ts
export const stackDefinitions: StackDefinition[] = [
  // existing definitions
  ...stackProposalDefinitions,
];
```

The proposed definitions use the existing `"next"` icon, so `src/components/StackIcon.tsx` does not need to change unless a custom icon is added later.

4. Add the builders to `stackFileBuilders`:

```ts
const stackFileBuilders: Record<StackId, (projectName: string) => GeneratedFile[]> =
  {
    // existing builders
    "next-saas-starter": stackProposalFileBuilders["next-saas-starter"],
    "ai-chatbot-starter": stackProposalFileBuilders["ai-chatbot-starter"],
    "marketing-content-starter":
      stackProposalFileBuilders["marketing-content-starter"],
  };
```

5. Check the generation flow:

```bash
npm run typecheck
npm run lint
```

The current `getStaticFiles` function adds README, `.env.example`, and `.gitignore` before stack-specific files. These proposal builders include their own versions of those files. The existing `mergeGeneratedFiles` call should keep the proposal-specific versions because later files with the same path win.

## Notes Before Enabling

- The SaaS starter includes Prisma and NextAuth files, but the dashboard route is intentionally not guarded yet. Add a provider and call `auth()` from the dashboard route when auth behavior is chosen.
- The chatbot starter runs with a local demo provider. Add a real provider SDK only inside the generated project, not the AgentStack base app.
- The marketing starter uses a typed content module rather than MDX or a CMS, keeping the generated project runnable without extra services.
