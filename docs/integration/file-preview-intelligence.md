# File Preview Intelligence

Status: components and utilities are isolated. They are not wired into the live preview yet, so current preview behavior stays unchanged.

## New modules

```ts
import {
  CopyAllAgentFilesButton,
  KeyFilesList,
  PreviewFileFilters,
  PreviewStatsPanel,
} from "@/components/file-preview";
import {
  filterPreviewFiles,
  type PreviewFileFilter,
} from "@/lib/file-preview";
```

Utilities classify files with this precedence:

1. Agent instructions: `CLAUDE.md`, `AGENT.md`, `AGENTS.md`, `.cursorrules`, `.windsurfrules`, `.cursor/rules/*`, `copilot-instructions.md`
2. Env files: `.env`, `.env.*`
3. Docs: `README.md`, common project docs, and `docs/*`
4. Config: package files, framework config, lint config, lockfiles, `.github/workflows/*`, Prisma, Supabase config
5. App files: everything else

## Later integration in `src/components/FilePreview.tsx`

Only do this when it is safe to edit the shared file.

Add imports:

```tsx
import {
  CopyAllAgentFilesButton,
  KeyFilesList,
  PreviewFileFilters,
  PreviewStatsPanel,
} from "@/components/file-preview";
import {
  filterPreviewFiles,
  type PreviewFileFilter,
} from "@/lib/file-preview";
```

Add filter state next to the existing selected path state:

```tsx
const [selectedPath, setSelectedPath] = useState(defaultPath);
const [activeFilter, setActiveFilter] = useState<PreviewFileFilter>("all");

const filteredFiles = useMemo(
  () => filterPreviewFiles(files, activeFilter),
  [activeFilter, files],
);
```

Use filtered files for the left file tree, while keeping the original fallback:

```tsx
const groups = useMemo(() => groupFiles(filteredFiles), [filteredFiles]);
const selectedFile =
  filteredFiles.find((file) => file.path === selectedPath) ??
  filteredFiles[0] ??
  files[0];
```

After the existing default-path effect, keep the selected file inside the active filter:

```tsx
useEffect(() => {
  if (!selectedFile) {
    return;
  }

  const selectedFileIsVisible = filteredFiles.some(
    (file) => file.path === selectedPath,
  );

  if (!selectedFileIsVisible) {
    setSelectedPath(selectedFile.path);
  }
}, [filteredFiles, selectedFile, selectedPath]);
```

Render the new controls above the current two-column preview grid:

```tsx
<PreviewStatsPanel
  activeFilter={activeFilter}
  files={files}
  onFilterChange={setActiveFilter}
/>
<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
  <PreviewFileFilters
    files={files}
    onChange={setActiveFilter}
    value={activeFilter}
  />
  <CopyAllAgentFilesButton files={files} />
</div>
```

Render key files inside the left column, above the grouped file list:

```tsx
<KeyFilesList
  files={files}
  onSelectFile={(file) => setSelectedPath(file.path)}
  selectedPath={selectedFile.path}
/>
```

## Notes

- `GenerateForm.tsx` does not need a change if `FilePreview.tsx` owns the integration.
- Keep `CopyAllAgentFilesButton` in a client component. It uses `navigator.clipboard`.
- The new components do not add syntax highlighting or new dependencies.
- If a future design adds search, apply it after filtering so counts remain tied to the filter buttons.
