# Product analytics integration

This branch only adds the analytics schema and no-op tracker. It does not wire
events into the app because `GenerateForm` and API routes are high-conflict
files in this workstream.

Import the tracker where instrumentation is added later:

```ts
import { trackEvent } from "@/lib/analytics";
```

## Privacy rules

- Do not send raw project briefs, prompts, or freeform input.
- Do not send generated file contents.
- Do not send GitHub access tokens or other credentials.
- Do not send repo URLs, file paths, user names, or email addresses unless a
  future privacy review explicitly allows them.
- Omit user identity by default. If identity is needed, pass only a stable hash
  through `context.user.accountIdHash` or `context.user.anonymousIdHash`.

## `src/components/GenerateForm.tsx`

Use this shared context for form events:

```ts
const analyticsContext = {
  route: "/generate",
  surface: "generate_form",
} as const;
```

Track `project_name_entered` on blur, not on every keystroke:

```tsx
const handleProjectNameBlur: FocusEventHandler<HTMLInputElement> = (event) => {
  const value = event.target.value.trim();

  if (!value) {
    return;
  }

  trackEvent({
    name: "project_name_entered",
    payload: {
      projectNameLength: value.length,
      isValid: !validateProjectName(value),
    },
    context: analyticsContext,
  });
};
```

Add `onBlur={handleProjectNameBlur}` to the project name input and add
`FocusEventHandler` to the React type imports.

Track `stack_selected` inside `handleStackSelect`, after the selected stack has
changed:

```ts
if (selectedStack !== stackId) {
  trackEvent({
    name: "stack_selected",
    payload: {
      stackId,
      ...(selectedStack ? { previousStackId: selectedStack } : {}),
      hadPreview: previewFiles !== null,
    },
    context: analyticsContext,
  });
}
```

Track `preview_requested` before the `/api/preview` fetch:

```ts
const previewStartedAt = performance.now();

trackEvent({
  name: "preview_requested",
  payload: {
    stackId: stack,
    projectNameLength: projectName.trim().length,
  },
  context: analyticsContext,
});
```

If client-side preview failures also need coverage, keep the payload small:

```ts
trackEvent({
  name: "preview_failed",
  payload: {
    stackId: stack,
    reason: "network_error",
    durationMs: Math.round(performance.now() - previewStartedAt),
  },
  context: analyticsContext,
});
```

Prefer the API route for `preview_succeeded` and server-side
`preview_failed`, so file counts and HTTP failures are recorded in one place.

Track GitHub sign-in clicks by passing the source into `signInWithGithub`:

```ts
async function signInWithGithub(
  source: "generate_form_button" | "generate_submit_gate",
) {
  trackEvent({
    name: "github_login_clicked",
    payload: { source },
    context: analyticsContext,
  });

  await signIn("github", { callbackUrl: "/generate" });
}
```

Use `"generate_form_button"` from the GitHub button click and
`"generate_submit_gate"` from the submit path that redirects unsigned users.

Track `generation_requested` before the `/api/generate` fetch:

```ts
const generationStartedAt = performance.now();

trackEvent({
  name: "generation_requested",
  payload: {
    stackId: stack,
    projectNameLength: projectName.trim().length,
    hadPreview: previewFiles !== null,
  },
  context: analyticsContext,
});
```

If the client sees a failed generation request before the API can record it,
send only the reason and status:

```ts
trackEvent({
  name: "generation_failed",
  payload: {
    stackId: stack,
    reason: "unexpected_response",
    statusCode: response.status,
    durationMs: Math.round(performance.now() - generationStartedAt),
  },
  context: analyticsContext,
});
```

Track `zip_download_clicked` from the future ZIP download button click handler.
Do not include file names or contents:

```ts
trackEvent({
  name: "zip_download_clicked",
  payload: {
    source: "success_page",
    fileCount: files.length,
  },
  context: {
    route: "/success",
    surface: "success_page",
  },
});
```

## `src/app/api/preview/route.ts`

Use the API route for outcome events. Add this near the imports:

```ts
import { trackEvent } from "@/lib/analytics";
```

After the stack is validated, define a local context:

```ts
const analyticsContext = {
  route: "/api/preview",
  surface: "preview_api",
} as const;
```

Before the success response:

```ts
trackEvent({
  name: "preview_succeeded",
  payload: {
    stackId: stack.id,
    fileCount: files.length,
  },
  context: analyticsContext,
});
```

For validation failures, omit `stackId` when the stack is not trusted:

```ts
trackEvent({
  name: "preview_failed",
  payload: {
    reason: "validation_error",
    statusCode: 400,
  },
  context: analyticsContext,
});
```

Inside the Gemini catch block:

```ts
trackEvent({
  name: "preview_failed",
  payload: {
    stackId: stack.id,
    reason: "upstream_generation_error",
    statusCode: 500,
  },
  context: analyticsContext,
});
```

## `src/app/api/generate/route.ts`

Add the same tracker import:

```ts
import { trackEvent } from "@/lib/analytics";
```

Define route context near the top of `POST`:

```ts
const analyticsContext = {
  route: "/api/generate",
  surface: "generate_api",
} as const;
```

For early exits, track the reason without project name, token, repo URL, or
client IP:

```ts
trackEvent({
  name: "generation_failed",
  payload: {
    reason: "auth_required",
    statusCode: 401,
  },
  context: analyticsContext,
});
```

Use these reasons for the current branches:

- `auth_required` for missing session access.
- `rate_limited` for IP or browser-session rate limits.
- `validation_error` for invalid JSON, project name, or stack.
- `upstream_generation_error` when Gemini file generation fails.
- `github_auth_rejected` for GitHub `401` or `403`.
- `github_repo_conflict` for GitHub `422`.
- `github_api_error` for other GitHub failures.

Before the success response:

```ts
trackEvent({
  name: "generation_succeeded",
  payload: {
    stackId: stack.id,
    fileCount: files.length,
  },
  context: analyticsContext,
});
```

For stack-specific failures after validation, include only the stack id:

```ts
trackEvent({
  name: "generation_failed",
  payload: {
    stackId: stack.id,
    reason: "github_api_error",
    statusCode: 500,
  },
  context: analyticsContext,
});
```
