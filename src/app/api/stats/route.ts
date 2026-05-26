import { NextResponse } from "next/server";

export async function GET() {
  const offset = Number(process.env.REPO_COUNT_OFFSET ?? 0);
  const count = Number.isFinite(offset) ? offset : 0;

  return NextResponse.json(
    { count },
    {
      headers: {
        "Cache-Control": "public, max-age=60",
      },
    },
  );
}
