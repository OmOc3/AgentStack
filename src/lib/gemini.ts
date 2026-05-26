import type { StackDefinition } from "@/lib/stacks";

const GEMINI_MODEL = "gemini-3.5-flash";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

type AgentFileKind = "CLAUDE.md" | "AGENT.md" | ".cursorrules";

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

type GeminiErrorResponse = {
  error?: {
    message?: string;
  };
};

const promptTemplates: Record<
  AgentFileKind,
  { system: string; user: (projectName: string, stackName: string) => string }
> = {
  "CLAUDE.md": {
    system:
      "You are an expert developer. Generate a CLAUDE.md file for a project. Output raw markdown only, no explanation.",
    user: (projectName, stackName) =>
      `Generate a CLAUDE.md for a ${stackName} project called ${projectName}.
Include: project overview, tech stack details, folder structure, coding conventions,
common commands (dev/build/lint), and AI agent working rules specific to this stack.`,
  },
  "AGENT.md": {
    system:
      "You are an expert developer. Generate an AGENT.md file. Output raw markdown only.",
    user: (projectName, stackName) =>
      `Generate an AGENT.md for a ${stackName} project called ${projectName}.
Include: agent persona, working rules, what to always do, what to never do,
file modification guidelines, and testing requirements.`,
  },
  ".cursorrules": {
    system:
      "You are an expert developer. Generate a .cursorrules file. Output raw text only.",
    user: (_projectName, stackName) =>
      `Generate .cursorrules for a ${stackName} project. Include coding style rules,
naming conventions, import preferences, and component structure guidelines.`,
  },
};

export async function generateAgentFiles(
  projectName: string,
  stack: StackDefinition,
) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY.");
  }

  const files = await Promise.all(
    (Object.keys(promptTemplates) as AgentFileKind[]).map(async (path) => {
      const prompt = promptTemplates[path];
      const response = await fetch(GEMINI_API_URL, {
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt.user(projectName, stack.name) }],
            },
          ],
          generationConfig: {
            maxOutputTokens: 2200,
          },
          systemInstruction: {
            parts: [{ text: prompt.system }],
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

        throw new Error(errorMessage);
      }

      const data = (await response.json()) as GeminiResponse;
      const content = data.candidates?.[0]?.content?.parts
        ?.map((part) => part.text)
        .filter((text): text is string => Boolean(text))
        .join("\n");

      if (!content) {
        throw new Error("Gemini returned no text.");
      }

      return {
        path,
        content: normalizeModelText(content),
      };
    }),
  );

  return files;
}

function normalizeModelText(value: string) {
  return `${value
    .trim()
    .replace(/^```(?:markdown|md|text)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim()}\n`;
}

async function getGeminiErrorMessage(response: Response) {
  const fallback = `Gemini request failed with status ${response.status}.`;

  try {
    const data = (await response.json()) as GeminiErrorResponse;

    return data.error?.message ?? fallback;
  } catch {
    return fallback;
  }
}
