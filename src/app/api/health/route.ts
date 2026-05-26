import { NextResponse } from "next/server";

import { getServerEnvStatus } from "@/lib/env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const envStatus = getServerEnvStatus();

  return NextResponse.json(
    {
      app: "ok",
      authConfigured: envStatus.authConfigured,
      authProviders: envStatus.authProviders,
      aiConfigured: envStatus.aiConfigured,
      appUrlConfigured: envStatus.appUrlConfigured,
      storage: "memory",
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
