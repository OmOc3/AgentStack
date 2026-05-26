import { type NextRequest, NextResponse } from "next/server";

import { handlers } from "@/lib/auth";
import { assertGitHubAuthEnv } from "@/lib/env";

function withGitHubAuthEnv(
  handler: (request: NextRequest) => Response | Promise<Response>,
  request: NextRequest,
) {
  try {
    assertGitHubAuthEnv();
  } catch (error) {
    console.error("GitHub auth environment is not configured", error);

    return NextResponse.json(
      { error: "GitHub sign-in is not configured." },
      { status: 503 },
    );
  }

  return handler(request);
}

export function GET(request: NextRequest) {
  return withGitHubAuthEnv(handlers.GET, request);
}

export function POST(request: NextRequest) {
  return withGitHubAuthEnv(handlers.POST, request);
}
