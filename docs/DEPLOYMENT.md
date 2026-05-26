# Deployment

AgentStack is set up for Vercel. The app uses Next.js App Router routes, one Edge route for Open Graph image generation, and Node.js runtime routes for Gemini, GitHub, and file preview APIs.

## Vercel Setup

1. Import the repository into Vercel.
2. Use the default Next.js framework settings.
3. Keep the install command as `npm install`.
4. Keep the build command as `npm run build`.
5. Use Node.js 20.19.0 or newer.
6. Add the required environment variables before the first production deploy.

## Required Environment Variables

Set these in Vercel Project Settings:

| Variable | Required | Notes |
| --- | --- | --- |
| `GITHUB_CLIENT_ID` | Yes | GitHub OAuth client ID for the deployed app. |
| `GITHUB_CLIENT_SECRET` | Yes | GitHub OAuth client secret. Keep this server-only. |
| `GEMINI_API_KEY` | Yes | Used by the active Gemini adapter during `/api/preview`. |
| `NEXTAUTH_SECRET` | Yes | Required for production auth session signing. |
| `NEXTAUTH_URL` | Yes | Use the canonical production URL, for example `https://your-domain.example`. |

Optional:

| Variable | Required | Notes |
| --- | --- | --- |
| `REPO_COUNT_OFFSET` | No | Integer returned by `/api/stats`; defaults to `0`. |
| `NEXT_PUBLIC_SUPABASE_URL` | No | Only needed if the currently unused Supabase helpers are wired into a route. Public value. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | No | Only needed with the Supabase helpers. Public value. |

Generate `NEXTAUTH_SECRET` with:

```bash
openssl rand -base64 32
```

Do not place real secrets in `.env.example`, docs, or screenshots.

## GitHub OAuth Callback

Create a production GitHub OAuth app, or update the existing app if this is the only active environment:

- Homepage URL: `https://your-production-domain`
- Authorization callback URL: `https://your-production-domain/api/auth/callback/github`

GitHub OAuth apps have a single callback URL. Use separate OAuth apps for local, preview, and production environments if those environments need to work at the same time.

The app requests `read:user`, `user:email`, and `repo` scopes in `src/lib/auth.ts`. The `repo` scope is broad, so keep the OAuth app description and internal runbooks clear about why it is requested.

## Production Runtime Notes

- `/api/preview` calls the active AI provider, validates generated files, stores a preview session, and returns generated files without creating a repo.
- `/api/generate` requires a GitHub session, validates the matching preview session, creates the repo, writes one initial commit, and returns the repo URL.
- `/api/files` reads generated file previews from in-memory process state with a 10 minute TTL.
- `/api/download` exports a ZIP from the same short-lived preview session.
- `/api/health` returns environment setup booleans and does not expose secret values.
- `/api/og` runs on the Edge runtime.
- Vercel Analytics is included through `@vercel/analytics/react` and does not require project env vars.

The generated file preview store is not durable. On Vercel, a success page or ZIP download may lose the file list after the TTL expires or if another function instance handles the request. The GitHub repo URL is still returned in the success URL.

The IP rate limit is also in memory. Treat it as a lightweight guard, not a production abuse-control system.

## Pre-Deploy Checks

Run these before promoting a change that touches source code:

```bash
npm run lint
npm run typecheck
npm run build
```

For changes to the generator flow, GitHub auth, or page behavior, also run:

```bash
npm run test:e2e
```

## Smoke Test After Deploy

1. Open the production homepage.
2. Open `/generate`.
3. Enter a disposable project name and choose a stack.
4. Generate a preview.
5. Sign in with GitHub.
6. Create the repo, confirm it exists on GitHub, then delete the disposable repo if needed.
