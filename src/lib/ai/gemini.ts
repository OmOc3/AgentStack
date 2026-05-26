import {
  AIInvalidResponseError,
  AIUpstreamError,
  MissingAIProviderConfigError,
} from "@/lib/ai/errors";
import { buildAgentFilePrompts, normalizeModelText } from "@/lib/ai/prompts";
import type { AgentFileGenerationProvider } from "@/lib/ai/types";

const GEMINI_PROVIDER_NAME = "gemini";
const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

type GeminiResponse = {
  candidates?: GeminiCandidate[];
};

type GeminiCandidate = {
  content?: {
    parts?: GeminiPart[];
  };
};

type GeminiPart = {
  text?: unknown;
};

type GeminiErrorResponse = {
  error?: {
    message?: string;
  };
};

export const geminiProvider: AgentFileGenerationProvider = {
  name: GEMINI_PROVIDER_NAME,
  async generateAgentFiles(input) {
    const apiKey = getGeminiApiKey();
    const prompts = buildAgentFilePrompts(input);

    const files = await Promise.all(
      prompts.map(async (prompt) => {
        const response = await fetch(GEMINI_API_URL, {
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: prompt.userPrompt }],
              },
            ],
            generationConfig: {
              maxOutputTokens: prompt.maxOutputTokens,
            },
            systemInstruction: {
              parts: [{ text: prompt.systemInstruction }],
            },
          }),
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          method: "POST",
        });

        if (!response.ok) {
          const errorMessage = await getGeminiErrorMessage(response);

          throw new AIUpstreamError(
            GEMINI_PROVIDER_NAME,
            errorMessage,
            response.status,
          );
        }

        const data: unknown = await response.json();
        const content = getGeminiContent(data);

        if (!content) {
          throw new AIInvalidResponseError(
            GEMINI_PROVIDER_NAME,
            "Gemini returned no text.",
          );
        }

        return {
          path: prompt.path,
          content: normalizeModelText(content),
        };
      }),
    );

    return {
      files,
      provider: GEMINI_PROVIDER_NAME,
      model: GEMINI_MODEL,
    };
  },
};

function getGeminiApiKey() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new MissingAIProviderConfigError(
      GEMINI_PROVIDER_NAME,
      "GEMINI_API_KEY",
    );
  }

  return apiKey;
}

function getGeminiContent(data: unknown) {
  if (!isGeminiResponse(data)) {
    return "";
  }

  const [candidate] = data.candidates ?? [];
  const parts = candidate?.content?.parts;

  if (!parts) {
    return "";
  }

  return parts
    .map((part) => part.text)
    .filter((text): text is string => Boolean(text))
    .join("\n");
}

async function getGeminiErrorMessage(response: Response) {
  const fallback = `Gemini request failed with status ${response.status}.`;

  try {
    const data: unknown = await response.json();

    return getGeminiErrorMessageFromData(data) ?? fallback;
  } catch {
    return fallback;
  }
}

function getGeminiErrorMessageFromData(data: unknown) {
  if (!isGeminiErrorResponse(data)) {
    return null;
  }

  return data.error?.message ?? null;
}

function isGeminiResponse(value: unknown): value is GeminiResponse {
  if (!isRecord(value)) {
    return false;
  }

  const { candidates } = value;

  if (candidates === undefined) {
    return true;
  }

  if (!Array.isArray(candidates)) {
    return false;
  }

  return candidates.every(isGeminiCandidate);
}

function isGeminiCandidate(value: unknown): value is GeminiCandidate {
  if (!isRecord(value)) {
    return false;
  }

  const { content } = value;

  if (content === undefined) {
    return true;
  }

  if (!isRecord(content)) {
    return false;
  }

  const { parts } = content;

  return parts === undefined || Array.isArray(parts);
}

function isGeminiErrorResponse(value: unknown): value is GeminiErrorResponse {
  if (!isRecord(value)) {
    return false;
  }

  const { error } = value;

  if (error === undefined) {
    return true;
  }

  if (!isRecord(error)) {
    return false;
  }

  return error.message === undefined || typeof error.message === "string";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
