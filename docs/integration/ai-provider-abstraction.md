# AI Provider Abstraction Migration

The new provider package lives in `src/lib/ai`. It is not wired into the app yet, so the current Gemini behavior is unchanged.

Use this migration when the app is ready to select AI providers through one factory instead of importing Gemini directly.

## Current Shape

- `src/lib/gemini.ts` owns the live Gemini implementation.
- `src/app/api/preview/route.ts` and `src/app/api/generate/route.ts` call `generateAgentFiles(projectName, stack)`.
- `src/lib/ai` now exposes `getAIProvider()`, provider errors, typed generation input and output, prompt helpers, and a Gemini adapter.

## Step 1: Keep `src/lib/gemini.ts` as the compatibility wrapper

Keep the public function name the routes already use. Replace the internals with the provider factory:

```ts
import { getAIProvider } from "@/lib/ai";
import type { GeneratedFile, StackDefinition } from "@/lib/stacks";

export async function generateAgentFiles(
  projectName: string,
  stack: StackDefinition,
): Promise<GeneratedFile[]> {
  const provider = getAIProvider();
  const result = await provider.generateAgentFiles({ projectName, stack });

  return result.files;
}
```

This keeps both routes stable while moving the provider-specific code behind `src/lib/ai`.

## Step 2: Map provider errors in the routes

After the wrapper migration, routes can keep their existing response text at first. When route-specific handling is needed, map the new error classes near the existing `catch` blocks:

```ts
import {
  AIInvalidResponseError,
  AIProviderUnavailableError,
  AIUpstreamError,
  MissingAIProviderConfigError,
} from "@/lib/ai";

function getGenerationErrorMessage(error: unknown) {
  if (error instanceof MissingAIProviderConfigError) {
    return "The AI provider is missing required configuration.";
  }

  if (error instanceof AIProviderUnavailableError) {
    return "The selected AI provider is not available.";
  }

  if (error instanceof AIInvalidResponseError) {
    return "The AI provider returned an empty response.";
  }

  if (error instanceof AIUpstreamError) {
    return "The AI provider could not generate files right now.";
  }

  return "AI file generation failed.";
}
```

Use that helper in `src/app/api/preview/route.ts` first because it has the smallest blast radius. Then apply the same handling to `src/app/api/generate/route.ts`.

## Step 3: Move provider selection into one place

When the app adds `AI_PROVIDER`, resolve it before calling the factory:

```ts
import {
  DEFAULT_AI_PROVIDER_NAME,
  getAIProvider,
  isAIProviderName,
} from "@/lib/ai";

const configuredProvider = process.env.AI_PROVIDER;
const providerName = isAIProviderName(configuredProvider)
  ? configuredProvider
  : DEFAULT_AI_PROVIDER_NAME;
const provider = getAIProvider(providerName);
```

Do this inside the wrapper first. That lets `/api/preview` and `/api/generate` keep their request flow while OpenAI or Anthropic adapters are added later.

## Step 4: Use project briefs as user context

If a route later accepts a project brief, pass it as `projectBrief`:

```ts
const result = await provider.generateAgentFiles({
  projectName,
  stack,
  projectBrief,
});
```

The prompt helpers append the brief to the user prompt only. They do not place user-provided text in the system instruction.

## Adding Another Provider

Add a new adapter with the same `AgentFileGenerationProvider` contract:

```ts
export const openAIProvider: AgentFileGenerationProvider = {
  name: "openai",
  async generateAgentFiles(input) {
    // Build prompts with buildAgentFilePrompts(input)
    // Return { files, provider: "openai", model: "..." }
  },
};
```

Then register it in `src/lib/ai/providers.ts`:

```ts
const providers: Partial<Record<AIProviderName, AgentFileGenerationProvider>> = {
  gemini: geminiProvider,
  openai: openAIProvider,
};
```

Routes should not need to know which SDK or API format the provider uses.
