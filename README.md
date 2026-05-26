# AgentStack

AgentStack creates AI-agent-ready GitHub repositories from a small set of curated starter stacks.

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set the GitHub OAuth callback URL to:

```text
http://localhost:3000/api/auth/callback/github
```

## Scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm run test:e2e
npm run build
```
