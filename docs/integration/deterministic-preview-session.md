# Deterministic preview sessions

This package lets the preview route save the exact generated files in memory, then lets the generate route create the GitHub repo from that same file list. The generate route should not call Gemini again after a preview session exists.

The package lives in:

- `src/lib/preview-session`
- `src/lib/generated-files`

## `/api/preview`

After the existing validation and file generation, create a preview session and return its id with the files.

```ts
import { getGeneratedFileStats } from "@/lib/generated-files/metadata";
import { createSession } from "@/lib/preview-session";

// Existing flow:
// 1. Parse body.
// 2. Validate projectName.
// 3. Validate stack.
// 4. Generate files.

const agentFiles = await generateAgentFiles(projectName, stack);
const files = mergeGeneratedFiles([
  ...getStaticFiles(projectName, stack),
  ...agentFiles,
]);
const previewSession = createSession({
  projectName,
  stackId: stack.id,
  files,
});

return NextResponse.json({
  files,
  previewSessionId: previewSession.id,
  previewExpiresAt: previewSession.expiresAt,
  fileStats: getGeneratedFileStats(files),
});
```

Keep the old `files` response field so the current preview UI can keep rendering the same data.

## `GenerateForm`

Store the preview session id next to `previewFiles`. Reset both values whenever the project name or stack changes.

```tsx
type PreviewResponse = {
  files?: unknown;
  previewSessionId?: unknown;
  error?: unknown;
};

const [previewFiles, setPreviewFiles] = useState<PreviewFile[] | null>(null);
const [previewSessionId, setPreviewSessionId] = useState<string | null>(null);

// On project name or stack change:
setPreviewFiles(null);
setPreviewSessionId(null);

// After /api/preview succeeds:
if (typeof data.previewSessionId !== "string") {
  throw new Error("The API did not return a preview session.");
}

setPreviewFiles(data.files);
setPreviewSessionId(data.previewSessionId);

// Before /api/generate:
if (!previewSessionId) {
  setError("Preview the generated files before creating the repo.");
  return;
}

// In the /api/generate body:
body: JSON.stringify({
  projectName,
  stack,
  previewSessionId,
});
```

## `/api/generate`

Add `previewSessionId` to the request body. Once auth, rate limits, project name, and stack validation pass, load the session and create the repo from `session.files`.

```ts
import {
  deleteSession,
  PreviewSessionExpiredError,
  PreviewSessionMismatchError,
  PreviewSessionNotFoundError,
  validateSessionMatch,
} from "@/lib/preview-session";

type GenerateRequestBody = {
  projectName?: unknown;
  stack?: unknown;
  previewSessionId?: unknown;
};

// Existing flow:
// 1. Auth check.
// 2. Rate-limit checks.
// 3. Parse body.
// 4. Validate projectName.
// 5. Validate stack.

if (typeof body.previewSessionId !== "string") {
  return NextResponse.json(
    { error: "Preview the generated files before creating the repo." },
    { status: 400 },
  );
}

let previewSession;

try {
  previewSession = validateSessionMatch({
    id: body.previewSessionId,
    projectName,
    stackId: stack.id,
  });
} catch (error) {
  if (
    error instanceof PreviewSessionNotFoundError ||
    error instanceof PreviewSessionExpiredError
  ) {
    return NextResponse.json(
      { error: "Preview expired. Generate a new preview before creating the repo." },
      { status: 409 },
    );
  }

  if (error instanceof PreviewSessionMismatchError) {
    return NextResponse.json(
      { error: "Preview no longer matches this request. Generate it again." },
      { status: 409 },
    );
  }

  throw error;
}

const repoUrl = await createRepositoryWithFiles({
  files: previewSession.files.map((file) => ({
    path: file.path,
    content: file.content,
  })),
  projectName,
  token: session.accessToken,
});

deleteSession(previewSession.id);
```

Do not regenerate files in `/api/generate`. The session files are the source of truth after the user previews them.

## Notes

- The default TTL is 10 minutes and the maximum TTL is 30 minutes.
- `createdAt` and `expiresAt` are Unix timestamps in milliseconds.
- `validateSessionMatch` checks the project name and stack id. It can also compare file content if a temporary migration still regenerates files.
- The memory store is process-local. It is enough for a single Node process, but production deployments with multiple instances need a shared store with the same interface.
