# ZIP download integration

This change adds two backend pieces:

- `createProjectZip(files, { projectName, rootDirectoryName })`
- `GET /api/download?previewId=...&projectName=...`

The download route does not require GitHub auth. Treat `previewId` as a short-lived bearer token and keep the preview store TTL low.

No ZIP dependency was added. The exporter writes a stored ZIP archive directly, which keeps this change inside the allowed files and is enough for the small generated projects AgentStack creates. If ZIP64 support or compression becomes necessary, add a small maintained ZIP package in a separate dependency change.

## Connect preview sessions

`src/app/api/preview/route.ts` currently returns only `{ files }`. Store the preview files and return the ID with the preview response:

```ts
import { createSession } from "@/lib/preview-session";

// after files are generated, merged, and validated
const previewSession = createSession({
  projectName,
  stackId: stack.id,
  files,
});

return NextResponse.json({
  files,
  previewId: previewSession.id,
  previewSessionId: previewSession.id,
});
```

If a different preview session store lands, keep the download route integration narrow by replacing only `resolvePreviewDownload` in `src/app/api/download/route.ts`:

```ts
async function resolvePreviewDownload(
  previewId: string,
): Promise<PreviewDownload | null> {
  const session = await getPreviewSession(previewId);

  if (!session) {
    return null;
  }

  return {
    files: session.files,
    projectName: session.projectName,
  };
}
```

After preview storage is wired, return `404` for expired or unknown preview IDs if that fits the final API behavior better than the current `501` placeholder response.

## Add the Download ZIP button

Update the preview response type in `src/components/GenerateForm.tsx`:

```ts
type PreviewResponse = {
  files?: unknown;
  previewId?: unknown;
  error?: unknown;
};
```

Add state for the stored preview ID and clear it when the project name or stack changes:

```ts
const [previewId, setPreviewId] = useState<string | null>(null);

// when projectName or selectedStack changes
setPreviewId(null);
```

After a successful preview request, save the ID:

```ts
if (typeof data.previewId !== "string") {
  throw new Error("The API did not return a preview ID.");
}

setPreviewFiles(data.files);
setPreviewId(data.previewId);
```

Render a plain link next to the preview action or repo action once files are available:

```tsx
{previewFiles && previewId ? (
  <a
    className="inline-flex min-h-11 items-center justify-center rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-zinc-950"
    href={`/api/download?${new URLSearchParams({
      previewId,
      projectName,
    }).toString()}`}
  >
    Download ZIP
  </a>
) : null}
```

That link can sit alongside the GitHub flow. It should not require `isSignedIn`.

## Path rules

The ZIP utility rejects file paths that are absolute, use `..`, include empty segments, contain control characters, or use Windows-reserved names. Keep generated file paths relative to the project root, such as `src/app/page.tsx` or `.env.example`.
