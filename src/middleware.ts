import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  if (process.env.PLAYWRIGHT_TEST === "1") {
    return NextResponse.next();
  }

  const { supabase, getResponse } = createClient(request);

  await supabase.auth.getUser();

  return getResponse();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
