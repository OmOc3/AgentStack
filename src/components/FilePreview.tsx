"use client";

import { useEffect, useMemo, useState } from "react";

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

export type PreviewFile = {
  path: string;
  content: string;
};

type FileGroup = {
  folder: string;
  files: PreviewFile[];
};

export function FilePreview({ files }: { files: PreviewFile[] }) {
  const defaultPath = useMemo(
    () =>
      files.find((file) => file.path === "CLAUDE.md")?.path ?? files[0]?.path,
    [files],
  );
  const [selectedPath, setSelectedPath] = useState(defaultPath);
  const [activeFilter, setActiveFilter] = useState<PreviewFileFilter>("all");

  useEffect(() => {
    setSelectedPath(defaultPath);
  }, [defaultPath]);

  const filteredFiles = useMemo(
    () => filterPreviewFiles(files, activeFilter),
    [activeFilter, files],
  );
  const groups = useMemo(() => groupFiles(filteredFiles), [filteredFiles]);
  const selectedFile =
    filteredFiles.find((file) => file.path === selectedPath) ??
    filteredFiles[0] ??
    files[0];

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

  if (!selectedFile) {
    return null;
  }

  return (
    <div className="space-y-4">
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

      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
        <div className="max-h-[32rem] space-y-4 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-950 p-3">
          <KeyFilesList
            files={files}
            onSelectFile={(file) => setSelectedPath(file.path)}
            selectedPath={selectedFile.path}
          />
          <div>
            <p className="px-2 pb-3 text-sm font-medium text-zinc-100">Files</p>
            <div className="space-y-4">
              {groups.map((group) => (
                <div key={group.folder}>
                  <p className="px-2 text-xs font-medium uppercase text-zinc-300">
                    {group.folder}
                  </p>
                  <div className="mt-2 space-y-1">
                    {group.files.map((file) => {
                      const isActive = file.path === selectedFile.path;

                      return (
                        <button
                          aria-current={isActive ? "true" : undefined}
                          className={`w-full rounded-md border px-3 py-2 text-left text-sm transition focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-zinc-950 ${
                            isActive
                              ? "border-purple-500/70 bg-purple-500/15 text-purple-100"
                              : "border-transparent text-zinc-300 hover:border-zinc-800 hover:bg-zinc-900"
                          }`}
                          key={file.path}
                          onClick={() => setSelectedPath(file.path)}
                          type="button"
                        >
                          <span className="block break-all font-mono text-xs">
                            {file.path}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {groups.length === 0 ? (
                <p className="rounded-md border border-dashed border-zinc-800 px-3 py-4 text-sm text-zinc-400">
                  No files match this filter.
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="min-w-0">
          <div className="mb-2 flex min-h-6 items-center justify-between gap-3">
            <p className="break-all font-mono text-sm text-zinc-300">
              {selectedFile.path}
            </p>
            <span className="shrink-0 text-xs text-zinc-300">
              {selectedFile.content.length.toLocaleString()} chars
            </span>
          </div>
          <pre className="max-h-[32rem] overflow-x-auto overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-900 p-4 font-mono text-xs leading-6 text-zinc-100">
            <code>{selectedFile.content}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}

function groupFiles(files: PreviewFile[]) {
  const groups = new Map<string, PreviewFile[]>();

  for (const file of [...files].sort((first, second) =>
    first.path.localeCompare(second.path),
  )) {
    const parts = file.path.split("/");
    const folder = parts.length > 1 ? parts.slice(0, -1).join("/") : "Root";
    const group = groups.get(folder);

    if (group) {
      group.push(file);
    } else {
      groups.set(folder, [file]);
    }
  }

  return Array.from(groups, ([folder, groupFiles]): FileGroup => ({
    folder,
    files: groupFiles,
  }));
}
