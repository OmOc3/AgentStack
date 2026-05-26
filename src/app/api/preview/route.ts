import { NextResponse } from "next/server";

import { generateAgentFiles } from "@/lib/gemini";
import {
  getStackDefinition,
  getStaticFiles,
  isStackId,
  mergeGeneratedFiles,
} from "@/lib/stacks";
import { validateProjectName } from "@/lib/validation";

export const runtime = "nodejs";

type PreviewRequestBody = {
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

  try {
    const agentFiles = await generateAgentFiles(projectName, stack);
    const files = mergeGeneratedFiles([
      ...getStaticFiles(projectName, stack),
      ...agentFiles,
    ]);

    return NextResponse.json({ files });
  } catch (error) {
    console.error("Gemini preview generation failed", error);

    return NextResponse.json(
      { error: "Gemini could not generate the preview files." },
      { status: 500 },
    );
  }
}
