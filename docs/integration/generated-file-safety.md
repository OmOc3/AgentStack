# Generated file safety integration

The reusable utilities live in `src/lib/generated-files`. They are independent of Next.js, so routes, ZIP code, and GitHub upload code can all use the same checks.

Call validation after generated and static files are merged, then pass only the normalized files onward. Do not keep using the original `files` array after validation.

## Preview route

Use this in `src/app/api/preview/route.ts` after `mergeGeneratedFiles(...)` and before `NextResponse.json({ files })`.

```ts
import { validateGeneratedFiles } from "@/lib/generated-files";

const validation = validateGeneratedFiles(files);

if (!validation.ok) {
  console.error("Generated preview files failed safety checks", validation.issues);

  return NextResponse.json(
    { error: "Generated files failed safety checks." },
    { status: 500 },
  );
}

return NextResponse.json({ files: validation.files });
```

## Generate route

Use this in `src/app/api/generate/route.ts` after `mergeGeneratedFiles(...)`. Store and upload `validation.files`, not the original list.

```ts
import { validateGeneratedFiles } from "@/lib/generated-files";

const validation = validateGeneratedFiles(files);

if (!validation.ok) {
  console.error("Generated repo files failed safety checks", validation.issues);

  return NextResponse.json(
    { error: "Generated files failed safety checks." },
    { status: 500 },
  );
}

const safeFiles = validation.files;

const repoUrl = await createRepositoryWithFiles({
  files: safeFiles,
  projectName,
  token: session.accessToken,
});
const previewSession = createSession({
  projectName,
  stackId: stack.id,
  files: safeFiles,
});
```

## ZIP download

When a ZIP download route is added, validate the stored files before adding entries to the archive.

```ts
import { validateGeneratedFiles } from "@/lib/generated-files";

const validation = validateGeneratedFiles(files);

if (!validation.ok) {
  return NextResponse.json(
    { error: "Generated files failed safety checks." },
    { status: 500 },
  );
}

for (const file of validation.files) {
  zip.file(file.path, file.content);
}
```

## GitHub upload

Validate once before calling `createRepositoryWithFiles`. For defense in depth, `src/lib/github.ts` can also assert duplicates and normalize each path before creating files.

```ts
import {
  GeneratedFilesValidationError,
  assertNoDuplicatePaths,
  normalizeGeneratedPath,
  validateGeneratedFiles,
} from "@/lib/generated-files";

assertNoDuplicatePaths(files);

for (const file of files) {
  const path = normalizeGeneratedPath(file.path);

  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo: repoName,
    path,
    message: `Add ${path}`,
    content: Buffer.from(file.content, "utf8").toString("base64"),
  });
}
```

If a caller prefers a single fail-fast error, wrap route-level validation like this:

```ts
const validation = validateGeneratedFiles(files);

if (!validation.ok) {
  throw new GeneratedFilesValidationError(validation.issues);
}
```
