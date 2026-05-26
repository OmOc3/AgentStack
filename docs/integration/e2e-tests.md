# E2E tests

The Playwright tests cover the public generator flow without calling Gemini,
GitHub, or OAuth.

## Run

```bash
npm run test:e2e
```

For parallel local work, use a separate port:

```bash
PLAYWRIGHT_PORT=3100 npm run test:e2e
```

The Playwright config starts its own Next.js server on
`127.0.0.1:$PLAYWRIGHT_PORT` and uses `3000` when the variable is not set. If
that port is busy, choose another port instead of reusing the existing server.

## What is mocked

Generator tests intercept `POST /api/preview` and return fixed file data. That
keeps the suite deterministic and prevents Gemini requests. The unsigned-user
case does not click the GitHub login button and keeps the generate button
disabled, so the suite does not call GitHub or start OAuth.

Use this pattern for new preview cases:

```ts
await page.route("**/api/preview", async (route) => {
  await route.fulfill({
    body: JSON.stringify({
      files: [
        { path: "CLAUDE.md", content: "# test-project\n" },
        { path: "README.md", content: "# test-project\n" },
      ],
    }),
    contentType: "application/json",
    status: 200,
  });
});
```

## Assumptions

- Each test runs in a fresh, unsigned browser context.
- Stack cards keep `role="radio"` inside the `Choose a stack` radiogroup.
- The generator preview request body keeps the shape `{ projectName, stack }`.
- Preview file objects keep the shape `{ path, content }`.

No application source changes are required for the current tests.
