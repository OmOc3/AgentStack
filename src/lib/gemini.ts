import type { GeneratedFile, StackDefinition } from "@/lib/stacks";

const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

type AgentFileKind = "CLAUDE.md" | "AGENT.md" | ".cursorrules" | "windsurfrules";

type AgentPromptTemplate = {
  path: GeneratedFile["path"];
  system: string;
  user: (projectName: string, stackName: string) => string;
};

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

const promptTemplates: Record<AgentFileKind, AgentPromptTemplate> = {
  "CLAUDE.md": {
    path: "CLAUDE.md",
    system:
      "You are an expert developer. Generate a CLAUDE.md file for a project. Output raw markdown only, no explanation.",
    user: (projectName, stackName) =>
      `Generate a professional CLAUDE.md for a project named "${projectName}" built
with ${stackName}.

Structure it with these exact sections:
# ${projectName}
## Stack
List each technology with its version and purpose.
## Project Structure
Show the expected folder tree with a one-line comment for each folder.
## Development Commands
\`\`\`bash blocks for: install, dev, build, lint, typecheck, test
## Architecture Rules
5-8 rules specific to ${stackName} (e.g. for Next.js: always use App Router,
never use pages/, use Server Components by default).
## Agent Working Rules
- Always run typecheck before finishing a task
- Never delete files without listing what will break
- Prefer editing existing files over creating new ones
- After any schema change, list all files that import that schema
## Do Not Touch
Files and folders the agent should never modify without explicit instruction.`,
  },
  "AGENT.md": {
    path: "AGENT.md",
    system:
      "You are an expert developer. Generate an AGENT.md file. Output raw markdown only.",
    user: (projectName, stackName) =>
      `Generate a professional AGENT.md for a project named "${projectName}" using
${stackName}.

Include:
# Agent Identity
Brief description of what this codebase does and the agent's role.
## Non-Negotiable Rules
Numbered list of 8-10 hard rules (e.g. never run destructive DB migrations
without showing the SQL first, never commit .env files).
## Stack Pitfalls for ${stackName}
5 common mistakes developers make with this stack and how to avoid them.
## File Modification Protocol
Step-by-step process agent must follow before editing any file.
## Danger Zone
Files that must never be deleted or overwritten: list them by path pattern.
## Definition of Done
Checklist agent must verify before declaring a task complete.`,
  },
  ".cursorrules": {
    path: ".cursorrules",
    system:
      "You are an expert developer. Generate a .cursorrules file. Output raw text only.",
    user: (_projectName, stackName) =>
      `Generate a .cursorrules file for a ${stackName} project.

Rules must be concrete and specific to ${stackName}, not generic.
Include rules for:
- Preferred import style and path aliases
- Component file structure (where to put types, hooks, components)
- Naming conventions (files, functions, components, constants)
- What to use instead of common anti-patterns in ${stackName}
- When to use Server Components vs Client Components (for Next.js stacks)
- State management approach
- Error handling pattern
Output as plain text, one rule per line, no markdown headers.`,
  },
  windsurfrules: {
    path: ".windsurfrules",
    system:
      "You are an expert developer. Generate a .windsurfrules file for Windsurf IDE. Output raw text only, no explanation.",
    user: (_projectName, stackName) =>
      `Generate .windsurfrules for a ${stackName} project. Include:
cascade rules for auto-applying code style, file patterns to always
watch, imports to auto-suggest, linting preferences, and forbidden
patterns the AI should never introduce.`,
  },
};

export async function generateAgentFiles(
  projectName: string,
  stack: StackDefinition,
): Promise<GeneratedFile[]> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY.");
  }

  const files = await Promise.all(
    (Object.keys(promptTemplates) as AgentFileKind[]).map(async (kind) => {
      const prompt = promptTemplates[kind];
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

      const data: unknown = await response.json();
      const content = getGeminiContent(data);

      if (!content) {
        throw new Error("Gemini returned no text.");
      }

      return {
        path: prompt.path,
        content: normalizeModelText(content),
      };
    }),
  );

  return files;
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

  return (
    candidates === undefined ||
    (Array.isArray(candidates) && candidates.every(isGeminiCandidate))
  );
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

  return (
    parts === undefined ||
    (Array.isArray(parts) && parts.every(isGeminiPart))
  );
}

function isGeminiPart(value: unknown): value is GeminiPart {
  return isRecord(value);
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
