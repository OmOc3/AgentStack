# Integration Changelog

## Integrated

- Generated file safety now validates preview, generate, GitHub write, and ZIP export paths.
- Preview sessions are the canonical short-lived store for preview files. `/api/generate` uses the saved preview instead of calling the AI provider again.
- Generation options now cover repo visibility, repo description, and an optional project brief.
- Environment validation is available at `/api/health`, and GitHub auth checks run inside the auth request path.
- `src/lib/gemini.ts` is now a compatibility wrapper over the AI provider abstraction.
- GitHub repo creation now writes one initial commit through the bulk writer.
- ZIP download is wired to preview sessions through `/api/download`.
- File preview now includes summary stats, filters, key files, and agent-file copy.
- The success page now uses launchpad components for clone, install, tool, and next-step guidance.
- Stack discovery search and category filters are live on the generator page.
- The three stack proposals are registered and covered by stack validation.
- Unit tests, E2E tests, and stack template validation are exposed as npm scripts.
- README and project docs now link to the documentation set and describe the deterministic preview flow.

## Skipped

- Analytics instrumentation is not wired into runtime events yet. The schema and no-op tracker are present, but full instrumentation needs a privacy pass over existing Vercel Analytics events.
- A shared durable preview-session backend is not included. The current store is process-local and keeps the existing lightweight deployment shape.

## Migration Notes

- `/api/generate` now requires `previewSessionId`; callers must preview files before creating a repo.
- Preview and generate requests should send the same `generationOptions` object.
- Success URLs include `stack` when available so launchpad commands can match the generated stack.
- ZIP downloads treat the preview session ID as a short-lived bearer token.
- Generated repo creation now produces one initial Git commit instead of one commit per file.
