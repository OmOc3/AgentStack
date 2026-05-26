# Environment Variables

This project uses `.env.local` for local development and Vercel Project Settings for deployed environments. Keep real secrets out of docs, `.env.example`, pull requests, and screenshots.

## Local File

Start from the checked-in example:

```bash
cp .env.example .env.local
```

Fill in real values:

```bash
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GEMINI_API_KEY=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
```

Generate a local auth secret with:

```bash
openssl rand -base64 32
```

## AgentStack App Variables

| Variable | Required | Used by | Notes |
| --- | --- | --- | --- |
| `GITHUB_CLIENT_ID` | Yes | `src/lib/auth.ts` | GitHub OAuth client ID. Required for sign-in. |
| `GITHUB_CLIENT_SECRET` | Yes | `src/lib/auth.ts` | GitHub OAuth client secret. Keep server-only. |
| `GEMINI_API_KEY` | Yes | `src/lib/ai/gemini.ts` | Required for AI preview generation. Repo creation uses the saved preview session. Keep server-only. |
| `NEXTAUTH_SECRET` | Production yes, local recommended | `src/lib/auth.ts` | Signs auth state. Development has a fallback, but local parity is better with a real value. |
| `NEXTAUTH_URL` | Production yes, local recommended | NextAuth runtime | Use the canonical origin, such as `http://localhost:3000` or the production domain. |
| `REPO_COUNT_OFFSET` | No | `src/app/api/stats/route.ts` | Optional number displayed as the generated repo count. Defaults to `0`. |
| `CI` | No | `playwright.config.ts` | Enables CI behavior for Playwright retries and `forbidOnly`. Usually set by CI. |
| `PLAYWRIGHT_TEST` | No | `playwright.config.ts` | Set by the Playwright web server config; do not set manually for normal local work. |

## GitHub OAuth URLs

Local development:

```text
http://localhost:3000/api/auth/callback/github
```

Production:

```text
https://your-production-domain/api/auth/callback/github
```

Set `NEXTAUTH_URL` to the same origin as the callback URL. If you run the dev server on a different port, update both `NEXTAUTH_URL` and the GitHub OAuth callback.

## Generated Repo Environment Files

`src/lib/stacks.ts` also generates `.env.example` files inside new starter repos. Those variables belong to the generated projects, not to AgentStack itself.

| Stack | Generated variables |
| --- | --- |
| `next-tailwind` | `NEXT_PUBLIC_APP_URL` |
| `next-supabase` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `next-firebase` | `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`, `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` |
| `next-drizzle` | `DATABASE_URL` |
| `expo-firebase` | `EXPO_PUBLIC_FIREBASE_API_KEY`, `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`, `EXPO_PUBLIC_FIREBASE_PROJECT_ID`, `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`, `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `EXPO_PUBLIC_FIREBASE_APP_ID` |
| `t3-stack` | `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET` |
| `next-prisma` | `DATABASE_URL` |
| `sveltekit-tailwind` | `PUBLIC_APP_URL` |
| `remix-tailwind` | `APP_URL` |
| `astro-tailwind` | `PUBLIC_APP_URL` |
| `next-saas-starter` | `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL` |
| `ai-chatbot-starter` | `AI_PROVIDER` |
| `marketing-content-starter` | `NEXT_PUBLIC_SITE_URL` |

When adding a stack, update its `.env.example` builder so generated projects document only the variables they actually need.

## Secret Handling

- Keep `GITHUB_CLIENT_SECRET`, `GEMINI_API_KEY`, and `NEXTAUTH_SECRET` server-only.
- Never add a secret with a `NEXT_PUBLIC_`, `PUBLIC_`, or `EXPO_PUBLIC_` prefix unless it is safe to expose to browsers or client bundles.
- Keep `.env.example` blank or clearly placeholder-only.
- Rotate any credential that appears in a commit, log, screenshot, or shared terminal output.
