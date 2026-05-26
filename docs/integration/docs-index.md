# Documentation Index Integration

This note records the README update to make after the current parallel work settles. Do not edit `README.md` during high-conflict work.

## Suggested README Section

Add this section after the opening description or after `Local Setup`:

```markdown
## Documentation

- [Local development](docs/LOCAL_DEVELOPMENT.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Environment variables](docs/ENVIRONMENT.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Contributing](docs/CONTRIBUTING.md)
```

## Optional README Cleanup

The current README already has a short local setup. After linking the detailed docs, it can stay as a quick start, or it can be trimmed to point readers to `docs/LOCAL_DEVELOPMENT.md`.

Keep the GitHub OAuth callback in README aligned with:

```text
http://localhost:3000/api/auth/callback/github
```
