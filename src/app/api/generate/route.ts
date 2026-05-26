import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { generateAgentFiles } from "@/lib/gemini";
import { createRepositoryWithFiles, getHttpStatus } from "@/lib/github";
import { REPO_GENERATED_COOKIE } from "@/lib/rate-limit";
import {
  getStackDefinition,
  getStaticFiles,
  isStackId,
  mergeGeneratedFiles,
} from "@/lib/stacks";
import { validateProjectName } from "@/lib/validation";

export const runtime = "nodejs";

type GenerateRequestBody = {
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

  const cookieStore = await cookies();

  if (cookieStore.get(REPO_GENERATED_COOKIE)) {
    return NextResponse.json(
      { error: "This browser session has already created a repo." },
      { status: 429 },
    );
  }

  let body: GenerateRequestBody;

  try {
    body = (await request.json()) as GenerateRequestBody;
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

  let agentFiles;

  try {
    agentFiles = await generateAgentFiles(projectName, stack);
  } catch (error) {
    console.error("Gemini generation failed", error);

    return NextResponse.json(
      { error: "Gemini could not generate the agent files." },
      { status: 500 },
    );
  }

  const files = mergeGeneratedFiles([
    ...getStaticFiles(projectName, stack),
    ...agentFiles,
  ]);

  try {
    const repoUrl = await createRepositoryWithFiles({
      files,
      projectName,
      token: session.accessToken,
    });

    const response = NextResponse.json({ repoUrl });

    response.cookies.set(REPO_GENERATED_COOKIE, "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("GitHub repo generation failed", error);

    const status = getHttpStatus(error);

    if (status === 401 || status === 403) {
      return NextResponse.json(
        { error: "GitHub rejected this session. Sign in again." },
        { status: 401 },
      );
    }

    if (status === 422) {
      return NextResponse.json(
        {
          error:
            "GitHub could not create that repo. The name may already exist on your account.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "GitHub could not create the repo." },
      { status: 500 },
    );
  }
}
