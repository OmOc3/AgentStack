import { NextResponse } from "next/server";

import { validateGeneratedFiles } from "@/lib/generated-files";
import {
  getSession,
  PreviewSessionExpiredError,
  PreviewSessionNotFoundError,
} from "@/lib/preview-session";
import type { GeneratedFile } from "@/lib/stacks";
import { createProjectZip, ZipExportError } from "@/lib/zip-export";

export const runtime = "nodejs";

type PreviewDownload = {
  files: GeneratedFile[];
  projectName?: string;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const previewId = getPreviewId(searchParams);

  if (!previewId) {
    return NextResponse.json(
      { error: "Add a previewId before downloading a ZIP." },
      { status: 400 },
    );
  }

  if (previewId.length > 128) {
    return NextResponse.json(
      { error: "Use a valid previewId before downloading a ZIP." },
      { status: 400 },
    );
  }

  // This route is intentionally unauthenticated. Treat preview IDs as short-lived bearer tokens.
  const preview = await resolvePreviewDownload(previewId);

  if (!preview) {
    return NextResponse.json(
      { error: "Generated files are no longer available." },
      { status: 404 },
    );
  }

  const projectName =
    getProjectName(searchParams) ?? preview.projectName ?? "agentstack-preview";

  try {
    const validation = validateGeneratedFiles(preview.files);

    if (!validation.ok) {
      console.error("Generated ZIP files failed safety checks", validation.issues);

      return NextResponse.json(
        { error: "Generated files failed safety checks." },
        { status: 500 },
      );
    }

    const zip = createProjectZip(validation.files, { projectName });
    const fileName = getDownloadFileName(projectName);

    return new Response(zip, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": String(zip.byteLength),
        "Content-Type": "application/zip",
      },
    });
  } catch (error) {
    if (error instanceof ZipExportError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("ZIP download failed", error);

    return NextResponse.json(
      { error: "Could not build the ZIP file." },
      { status: 500 },
    );
  }
}

function getPreviewId(searchParams: URLSearchParams) {
  const previewId = searchParams.get("previewId")?.trim();
  const legacyPreviewId = searchParams.get("pid")?.trim();

  return previewId || legacyPreviewId || null;
}

function getProjectName(searchParams: URLSearchParams) {
  const projectName = searchParams.get("projectName")?.trim();

  return projectName || null;
}

async function resolvePreviewDownload(
  previewId: string,
): Promise<PreviewDownload | null> {
  try {
    const previewSession = getSession(previewId);

    return {
      files: previewSession.files.map((file) => ({
        path: file.path,
        content: file.content,
      })),
      projectName: previewSession.projectName,
    };
  } catch (error) {
    if (
      error instanceof PreviewSessionNotFoundError ||
      error instanceof PreviewSessionExpiredError
    ) {
      return null;
    }

    throw error;
  }
}

function getDownloadFileName(projectName: string) {
  const safeName = projectName
    .replace(/[^a-zA-Z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");

  return `${safeName || "agentstack-project"}.zip`;
}
