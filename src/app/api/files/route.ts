import { NextResponse } from "next/server";

import {
  getSession,
  PreviewSessionExpiredError,
  PreviewSessionNotFoundError,
} from "@/lib/preview-session";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const previewId = searchParams.get("pid");

  if (!previewId) {
    return NextResponse.json(
      { error: "Generated files are no longer available." },
      { status: 404 },
    );
  }

  try {
    const previewSession = getSession(previewId);

    return NextResponse.json({ files: previewSession.files });
  } catch (error) {
    if (
      error instanceof PreviewSessionNotFoundError ||
      error instanceof PreviewSessionExpiredError
    ) {
      return NextResponse.json(
        { error: "Generated files are no longer available." },
        { status: 404 },
      );
    }

    console.error("Generated files lookup failed", error);

    return NextResponse.json(
      { error: "Generated files are not available right now." },
      { status: 500 },
    );
  }
}
