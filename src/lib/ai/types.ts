import type { GeneratedFile, StackDefinition } from "@/lib/stacks";

export const aiProviderNames = ["gemini", "openai", "anthropic"] as const;

export type AIProviderName = (typeof aiProviderNames)[number];

export type AgentFileGenerationInput = {
  projectName: string;
  stack: StackDefinition;
  projectBrief?: string;
};

export type AgentFileGenerationResult = {
  files: GeneratedFile[];
  provider: AIProviderName;
  model: string;
};

export type AgentFileGenerationProvider = {
  readonly name: AIProviderName;
  generateAgentFiles(
    input: AgentFileGenerationInput,
  ): Promise<AgentFileGenerationResult>;
};

export function isAIProviderName(value: unknown): value is AIProviderName {
  return (
    typeof value === "string" &&
    (aiProviderNames as readonly string[]).includes(value)
  );
}
