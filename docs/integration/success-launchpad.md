# Success Launchpad Integration

The launchpad components are isolated from the current success page. They can be added when `src/app/success/page.tsx` is ready to pass `repoUrl`, optional `stackId`, and optional file stats.

## 1. Import the components

Add this import near the other component imports in `src/app/success/page.tsx`:

```tsx
import {
  CloneCommandCard,
  GeneratedRepoSummary,
  InstallCommandsCard,
  NextStepsChecklist,
  OpenInToolsPanel,
  type GeneratedRepoFileStats,
} from "@/components/success";
```

## 2. Pass `stackId` when the route has it

If the success route starts receiving a stack query param, extend the `searchParams` type:

```tsx
type SuccessPageProps = {
  searchParams: Promise<{
    pid?: string | string[];
    repo?: string | string[];
    stack?: string | string[];
  }>;
};
```

Then read it beside `repoUrl`:

```tsx
const stackId = Array.isArray(params.stack) ? params.stack[0] : params.stack;
```

## 3. Build optional file stats

After `files` is loaded, derive the file stats object. If `previewId` exists but `files` is null, the preview likely expired or could not be read.

```tsx
const fileStats: GeneratedRepoFileStats | null = files
  ? {
      fileCount: files.length,
      totalBytes: files.reduce((total, file) => total + file.content.length, 0),
      files: files.map((file) => ({
        path: file.path,
        sizeBytes: file.content.length,
      })),
      previewStatus: "available",
    }
  : previewId
    ? { previewStatus: "expired" }
    : null;
```

## 4. Place the launchpad

Place this block inside the main content container, after the current top repo summary grid and before the existing manual "What to do next" section. If the old manual section becomes redundant, remove it in the same integration change.

```tsx
{
  repoUrl ? (
    <section className="mt-6 grid gap-5 lg:grid-cols-2">
      <GeneratedRepoSummary
        className="lg:col-span-2"
        fileStats={fileStats}
        repoUrl={repoUrl}
        stackId={stackId}
      />
      <CloneCommandCard repoUrl={repoUrl} />
      <InstallCommandsCard stackId={stackId} />
      <OpenInToolsPanel className="lg:col-span-2" repoUrl={repoUrl} />
      <NextStepsChecklist
        className="lg:col-span-2"
        previewStatus={fileStats?.previewStatus}
        repoUrl={repoUrl}
        stackId={stackId}
      />
    </section>
  ) : null;
}
```

Minimal integration only needs `repoUrl`:

```tsx
{
  repoUrl ? (
    <section className="mt-6 grid gap-5 lg:grid-cols-2">
      <CloneCommandCard repoUrl={repoUrl} />
      <InstallCommandsCard />
      <OpenInToolsPanel className="lg:col-span-2" repoUrl={repoUrl} />
      <NextStepsChecklist className="lg:col-span-2" repoUrl={repoUrl} />
    </section>
  ) : null;
}
```
