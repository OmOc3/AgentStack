import {
  DEFAULT_AI_PROVIDER_NAME,
  getAIProvider,
  isAIProviderName,
} from "@/lib/ai";
import type { GeneratedFile, StackDefinition } from "@/lib/stacks";

export async function generateAgentFiles(
  projectName: string,
  stack: StackDefinition,
  projectBrief?: string,
): Promise<GeneratedFile[]> {
  const provider = getAIProvider(getConfiguredProviderName());
  const result = await provider.generateAgentFiles({
    projectName,
    stack,
    ...(projectBrief ? { projectBrief } : {}),
  });

  return result.files;
}

function getConfiguredProviderName() {
  const providerName = process.env.AI_PROVIDER;

  return isAIProviderName(providerName) ? providerName : DEFAULT_AI_PROVIDER_NAME;
}
