# Local Development

This guide covers running AgentStack on your machine. The app is a Next.js App Router project that uses GitHub OAuth, an AI provider for preview files, and the signed-in user's GitHub token to create repos.

## Requirements

- Node.js 20.19.0 or newer
- npm
- A GitHub OAuth app for local sign-in
- A Gemini API key for the active preview provider

## Install

```bash
npm install
```

## Environment Setup

Copy the checked-in example file and fill in real values:

```bash
cp .env.example .env.local
```

Use these local values:

```bash
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GEMINI_API_KEY=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
```

Generate `NEXTAUTH_SECRET` locally with:

```bash
openssl rand -base64 32
```

`GEMINI_API_KEY` is required for `/api/preview` while Gemini is the active provider. `/api/generate` uses the saved preview session, so it should not call the provider again. GitHub OAuth values are required before a user can sign in and create a repository.

## GitHub OAuth Setup

Create a GitHub OAuth app for local development:

- Homepage URL: `http://localhost:3000`
- Authorization callback URL: `http://localhost:3000/api/auth/callback/github`

The app requests `read:user`, `user:email`, and `repo` scopes. The `repo` scope is used by Octokit when AgentStack creates the generated repository from the signed-in account.

## Run the App

```bash
npm run dev
```

Open `http://localhost:3000`.

The generator flow is:

1. Enter a project name.
2. Choose a supported stack.
3. Preview the generated files.
4. Download a ZIP if you want a local copy without GitHub.
5. Sign in with GitHub.
6. Create the GitHub repo.

Project names allow letters, numbers, and hyphens, up to 100 characters.

## Checks

Use the narrowest check that matches your change:

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run validate:stacks
npm run build
npm run test:e2e
```

`npm run test:e2e` starts the dev server on `http://127.0.0.1:3000` through Playwright. Set `PLAYWRIGHT_PORT=3100` if port 3000 is busy. The current smoke tests cover the homepage and unsigned generator setup; they do not create a GitHub repo.

If Playwright reports that Chromium is missing, install the local browser once:

```bash
npx playwright install --with-deps chromium
```

## Common Issues

### GitHub Sign-In Fails

Check that `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, and `NEXTAUTH_URL` are set in `.env.local`. The callback URL in the GitHub OAuth app must exactly match the local URL.

### Preview Fails with a Gemini Error

Set `GEMINI_API_KEY` in `.env.local` and restart the dev server. Preview asks the active provider to create `CLAUDE.md`, `AGENT.md`, `.cursorrules`, and `.windsurfrules`.

### Repo Creation Fails

If GitHub rejects the repo with a conflict, the repo name may already exist on the signed-in account. Choose a different project name.

### "This Browser Session Has Already Created a Repo"

AgentStack sets an `agentstack_generated` cookie after a successful repo creation. Clear that cookie or use a fresh browser session if you need another local test run.

### Too Many Requests

The API allows 3 repo generation requests per IP per hour in process memory. In local development, restarting the dev server resets the IP counter, but the browser cookie still applies.

### Port 3000 Is Busy

Run Next.js on another port:

```bash
npm run dev -- --port 3001
```

If you use GitHub sign-in on another port, update `NEXTAUTH_URL` and the GitHub OAuth callback URL to match that port.
