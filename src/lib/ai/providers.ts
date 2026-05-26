import { AIProviderUnavailableError } from "@/lib/ai/errors";
import { geminiProvider } from "@/lib/ai/gemini";
import type {
  AgentFileGenerationProvider,
  AIProviderName,
} from "@/lib/ai/types";

export const DEFAULT_AI_PROVIDER_NAME: AIProviderName = "gemini";

const providers: Partial<Record<AIProviderName, AgentFileGenerationProvider>> = {
  gemini: geminiProvider,
};

export function getAIProvider(
  providerName: AIProviderName = DEFAULT_AI_PROVIDER_NAME,
) {
  const provider = providers[providerName];

  if (!provider) {
    throw new AIProviderUnavailableError(providerName);
  }

  return provider;
}
