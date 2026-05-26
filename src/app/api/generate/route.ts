import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { validateGeneratedFiles } from "@/lib/generated-files";
import { normalizeGenerationOptions } from "@/lib/generation-options";
import { createRepositoryWithFiles } from "@/lib/github";
import {
  GitHubRateLimitError,
  GitHubRepoAlreadyExistsError,
  GitHubUnauthorizedError,
  GitHubValidationError,
} from "@/lib/github-bulk-writer";
import {
  PreviewSessionExpiredError,
  PreviewSessionMismatchError,
  PreviewSessionNotFoundError,
  validateSessionMatch,
  type JsonObject,
} from "@/lib/preview-session";
import {
  checkIpRateLimit,
  getClientIp,
  REPO_GENERATED_COOKIE,
} from "@/lib/rate-limit";
import { getStackDefinition, isStackId } from "@/lib/stacks";
import type { GeneratedFile } from "@/lib/stacks";
import { validateProjectName } from "@/lib/validation";

export const runtime = "nodejs";

type GenerateRequestBody = {
  generationOptions?: unknown;
  previewSessionId?: unknown;
  projectName?: unknown;
  stack?: unknown;
};

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.accessToken) {
    return NextResponse.json(
      { error: "Sign in with GitHub before creating a repo." },
      { status: 401 },
    );
  }

  const ip = getClientIp(request);
  const ipRateLimit = checkIpRateLimit(ip);

  if (!ipRateLimit.allowed) {
    return NextResponse.json(
      {
        error: `Too many repos generated from this IP. Try again in ${ipRateLimit.retryAfter} minutes.`,
      },
      { status: 429 },
    );
  }

  const cookieStore = await cookies();

  if (cookieStore.get(REPO_GENERATED_COOKIE)) {
    return NextResponse.json(
      { error: "This browser session has already created a repo." },
      { status: 429 },
    );
  }

  let requestBody: unknown;

  try {
    requestBody = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Send a valid JSON request body." },
      { status: 400 },
    );
  }

  const body: GenerateRequestBody = isGenerateRequestBody(requestBody)
    ? requestBody
    : {};
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

  if (typeof body.previewSessionId !== "string") {
    return NextResponse.json(
      { error: "Preview the generated files before creating the repo." },
      { status: 400 },
    );
  }

  const generationOptions = generationOptionsResult.options;
  const projectBrief = generationOptions.projectBrief?.content;
  let previewSession;

  try {
    previewSession = validateSessionMatch({
      id: body.previewSessionId,
      projectName,
      stackId: stack.id,
      ...(projectBrief ? { projectBrief } : {}),
      generationOptions: toSessionGenerationOptions(generationOptions),
    });
  } catch (error) {
    if (
      error instanceof PreviewSessionNotFoundError ||
      error instanceof PreviewSessionExpiredError
    ) {
      return NextResponse.json(
        {
          error:
            "Preview expired. Generate a new preview before creating the repo.",
        },
        { status: 409 },
      );
    }

    if (error instanceof PreviewSessionMismatchError) {
      return NextResponse.json(
        { error: "Preview no longer matches this request. Generate it again." },
        { status: 409 },
      );
    }

    throw error;
  }

  const validation = validateGeneratedFiles(previewSession.files);

  if (!validation.ok) {
    console.error(
      "Generated repo files failed safety checks",
      validation.issues,
    );

    return NextResponse.json(
      { error: "Generated files failed safety checks." },
      { status: 500 },
    );
  }

  const files = toGeneratedFiles(validation.files);

  try {
    const repoUrl = await createRepositoryWithFiles({
      description: generationOptions.description,
      files,
      projectName,
      token: session.accessToken,
      visibility: generationOptions.visibility,
    });

    const response = NextResponse.json({
      previewId: previewSession.id,
      previewSessionId: previewSession.id,
      repoUrl,
    });

    response.cookies.set(REPO_GENERATED_COOKIE, "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("GitHub repo generation failed", error);

    if (error instanceof GitHubUnauthorizedError) {
      return NextResponse.json(
        { error: "GitHub rejected this session. Sign in again." },
        { status: 401 },
      );
    }

    if (error instanceof GitHubRepoAlreadyExistsError) {
      return NextResponse.json(
        {
          error:
            "GitHub could not create that repo. The name may already exist on your account.",
        },
        { status: 409 },
      );
    }

    if (error instanceof GitHubRateLimitError) {
      return NextResponse.json(
        { error: "GitHub is rate limiting requests right now. Try again soon." },
        { status: 429 },
      );
    }

    if (error instanceof GitHubValidationError) {
      return NextResponse.json(
        {
          error:
            "GitHub could not create this repository. Check the repo name and generated files.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "GitHub could not create the repo." },
      { status: 500 },
    );
  }
}

function isGenerateRequestBody(value: unknown): value is GenerateRequestBody {
  return typeof value === "object" && value !== null;
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
