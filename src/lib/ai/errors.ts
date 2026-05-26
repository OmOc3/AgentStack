import type { AIProviderName } from "@/lib/ai/types";

export abstract class AIProviderError extends Error {
  readonly providerName: AIProviderName;

  protected constructor(message: string, providerName: AIProviderName) {
    super(message);
    this.name = new.target.name;
    this.providerName = providerName;
  }
}

export class MissingAIProviderConfigError extends AIProviderError {
  readonly configKey: string;

  constructor(providerName: AIProviderName, configKey: string) {
    super(
      `Missing ${configKey} for the ${providerName} AI provider.`,
      providerName,
    );
    this.configKey = configKey;
  }
}

export class AIProviderUnavailableError extends AIProviderError {
  constructor(providerName: AIProviderName) {
    super(
      `No AI provider adapter is registered for "${providerName}".`,
      providerName,
    );
  }
}

export class AIInvalidResponseError extends AIProviderError {
  constructor(providerName: AIProviderName, message?: string) {
    super(
      message ?? "The AI provider returned an invalid response.",
      providerName,
    );
  }
}

export class AIUpstreamError extends AIProviderError {
  readonly statusCode: number | null;

  constructor(
    providerName: AIProviderName,
    message: string,
    statusCode?: number,
  ) {
    super(message, providerName);
    this.statusCode = statusCode ?? null;
  }
}
