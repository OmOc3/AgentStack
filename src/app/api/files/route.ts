import { NextResponse } from "next/server";

import { getStoredFiles } from "@/lib/file-store";

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

  const files = getStoredFiles(previewId);

  if (!files) {
    return NextResponse.json(
      { error: "Generated files are no longer available." },
      { status: 404 },
    );
  }

  return NextResponse.json({ files });
}
