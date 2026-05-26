# Environment validation integration

This project now has a small server-side validation layer in `src/lib/env.ts`.
The health route at `/api/health` reports setup status with booleans only, so it
does not expose secret values.

## Current checks

- GitHub auth: `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`
- Production auth secret: `NEXTAUTH_SECRET`
- AI provider: `GEMINI_API_KEY`
- App URL: `NEXTAUTH_URL`, validated as an HTTP or HTTPS URL

`NEXTAUTH_SECRET` is not required in local development because `src/lib/auth.ts`
already provides a development-only fallback.

## Suggested auth update

Do not call `assertGitHubAuthEnv()` at module scope. Keep the check inside a
request path so missing local variables do not break builds or imports.

Suggested edit for `src/app/api/auth/[...nextauth]/route.ts`:

```ts
import { NextResponse } from "next/server";

import { handlers } from "@/lib/auth";
import { assertGitHubAuthEnv } from "@/lib/env";

async function withGitHubAuthEnv(
  handler: (request: Request) => Promise<Response>,
  request: Request,
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

export function GET(request: Request) {
  return withGitHubAuthEnv(handlers.GET, request);
}

export function POST(request: Request) {
  return withGitHubAuthEnv(handlers.POST, request);
}
```

If the app later moves from `NEXTAUTH_SECRET` to `AUTH_SECRET`, update
`src/lib/env.ts`, `src/lib/auth.ts`, and `.env.example` in the same change.

## Suggested AI provider update

Suggested edit for `src/lib/gemini.ts` inside `generateAgentFiles()`:

```ts
import { assertAIEnv, getRequiredEnv } from "@/lib/env";

export async function generateAgentFiles(
  projectName: string,
  stack: StackDefinition,
): Promise<GeneratedFile[]> {
  assertAIEnv();

  const apiKey = getRequiredEnv("GEMINI_API_KEY");

  // Existing generation code stays the same below this point.
}
```

This keeps the failure at request time and avoids logging or returning the key.

## Suggested README update

Add a short environment section:

```md
## Environment

Copy `.env.example` to `.env.local`, then fill in:

- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `GEMINI_API_KEY`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

The health endpoint is available at `/api/health`. It returns setup booleans and
does not include secret values.
```

## Suggested `.env.example` update

Keep the same variables and give the local URL a concrete default:

```env
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GEMINI_API_KEY=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
```
