import { NextResponse } from "next/server";

import {
  AIInvalidResponseError,
  AIProviderUnavailableError,
  AIUpstreamError,
  MissingAIProviderConfigError,
} from "@/lib/ai";
import { generateAgentFiles } from "@/lib/gemini";
import { validateGeneratedFiles } from "@/lib/generated-files";
import { normalizeGenerationOptions } from "@/lib/generation-options";
import { createSession, type JsonObject } from "@/lib/preview-session";
import {
  getStackDefinition,
  getStaticFiles,
  isStackId,
  mergeGeneratedFiles,
} from "@/lib/stacks";
import type { GeneratedFile } from "@/lib/stacks";
import { validateProjectName } from "@/lib/validation";

export const runtime = "nodejs";

type PreviewRequestBody = {
  generationOptions?: unknown;
  projectName?: unknown;
  stack?: unknown;
};

export async function POST(request: Request) {
  let body: PreviewRequestBody;

  try {
    body = (await request.json()) as PreviewRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Send a valid JSON request body." },
      { status: 400 },
    );
  }

  const projectName =
    typeof body.projectName === "string" ? body.projectName.trim() : "";
  const projectNameError = validateProjectName(projectName);

  if (projectNameError) {
    return NextResponse.json({ error: projectNameError }, { status: 400 });
  }

  if (!isStackId(body.stack)) {
    return NextResponse.json(
      { error: "Choose a supported stack." },
      { status: 400 },
    );
  }

  const stack = getStackDefinition(body.stack);

  if (!stack) {
    return NextResponse.json(
      { error: "Choose a supported stack." },
      { status: 400 },
    );
  }

  const generationOptionsResult = normalizeGenerationOptions(
    body.generationOptions,
  );

  if (!generationOptionsResult.ok) {
    return NextResponse.json(
      {
        error:
          generationOptionsResult.errors[0]?.message ??
          "Check the generation options.",
      },
      { status: 400 },
    );
  }

  const generationOptions = generationOptionsResult.options;
  const projectBrief = generationOptions.projectBrief?.content;

  try {
    const agentFiles = await generateAgentFiles(projectName, stack, projectBrief);
    const files = mergeGeneratedFiles([
      ...getStaticFiles(projectName, stack),
      ...agentFiles,
    ]);
    const validation = validateGeneratedFiles(files);

    if (!validation.ok) {
      console.error(
        "Generated preview files failed safety checks",
        validation.issues,
      );

      return NextResponse.json(
        { error: "Generated files failed safety checks." },
        { status: 500 },
      );
    }

    const safeFiles = toGeneratedFiles(validation.files);
    const previewSession = createSession({
      projectName,
      stackId: stack.id,
      files: safeFiles,
      ...(projectBrief ? { projectBrief } : {}),
      generationOptions: toSessionGenerationOptions(generationOptions),
    });

    return NextResponse.json({
      files: safeFiles,
      previewId: previewSession.id,
      previewSessionId: previewSession.id,
      previewExpiresAt: previewSession.expiresAt,
      fileStats: validation.stats,
    });
  } catch (error) {
    console.error("AI preview generation failed", error);

    return NextResponse.json(
      { error: getGenerationErrorMessage(error) },
      { status: 500 },
    );
  }
}

function toGeneratedFiles(files: readonly GeneratedFile[]): GeneratedFile[] {
  return files.map((file) => ({
    path: file.path,
    content: file.content,
  }));
}

function toSessionGenerationOptions(options: {
  description: string;
  projectBrief: { content: string } | null;
  visibility: string;
}): JsonObject {
  return {
    description: options.description,
    projectBrief: options.projectBrief?.content ?? null,
    visibility: options.visibility,
  };
}

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
