# Contributing

Keep changes small, reviewable, and tied to the task. AgentStack has a compact codebase, so broad rewrites usually make merge conflicts worse without improving the product.

## Branch Naming

Use short, lowercase branch names:

- `feature/add-stack-name`
- `fix/github-error-copy`
- `docs/local-development`
- `chore/update-checks`

Add an issue number when one exists, for example `feature/123-add-stack-name`.

## Local Workflow

```bash
npm install
npm run dev
```

Before opening a pull request, check the diff:

```bash
git diff --check
```

For source changes, run:

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run validate:stacks
npm run build
```

Run Playwright when a change affects navigation, forms, auth-adjacent UI, or the generator flow:

```bash
npm run test:e2e
```

The current e2e suite is a smoke test. It does not call Gemini or create a GitHub repo.

If Chromium is not installed locally, run:

```bash
npx playwright install --with-deps chromium
```

## Pull Request Notes

Include:

- What changed.
- How it was tested.
- Any environment or deployment change.
- Screenshots for visible UI changes.

Do not include real secrets, generated `.env.local` values, or disposable GitHub tokens in PR text.

## Stack Template Contribution Rules

Stack templates live in `src/lib/stacks.ts`, with proposal builders in `src/lib/stack-proposals`. When adding or changing a stack, keep the generated repo usable after `npm install`.

For a new stack:

1. Add the ID to `stackIds`.
2. Add display metadata to `stackDefinitions`.
3. Add a builder to `stackFileBuilders`.
4. Add generated env variables to the stack's `.env.example` builder.
5. Add template functions near related stack code.
6. Check the generated file paths for duplicates.

Template rules:

- Generate only project files. Do not generate lockfiles unless the project policy changes.
- Keep `.env.example` values blank or local-safe. Do not include fake secrets.
- Include practical scripts for the target framework, usually `dev`, `build`, and any available `lint` or `typecheck` command.
- Keep dependencies focused on the stack. Do not add optional tooling just because it might be useful.
- Use relative file paths in `GeneratedFile.path`.
- Remember that `mergeGeneratedFiles` keeps the last file for a duplicate path.
- Do not hardcode the AI-generated agent files in stack builders. `generateAgentFiles` owns `CLAUDE.md`, `AGENT.md`, `.cursorrules`, and `.windsurfrules`.

When changing shared templates such as `nextTailwindFiles`, test at least one existing stack that uses the shared builder.

## Auth and GitHub Changes

Be careful with OAuth scopes. The app currently requests `read:user`, `user:email`, and `repo`. Any scope change should explain why it is needed and what user capability it affects.

Never log access tokens, OAuth secrets, AI provider keys, or generated file contents that may include user-provided project details.

## Documentation Changes

Documentation should describe current behavior, not intended behavior. If a feature is planned but not built, call that out clearly or leave it out.
