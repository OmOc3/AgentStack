export type PreviewGeneratedFile = {
  path: string;
  content: string;
};

export const previewFileFilters = [
  "all",
  "agent",
  "app",
  "config",
  "docs",
  "env",
] as const;

export type PreviewFileFilter = (typeof previewFileFilters)[number];
export type PreviewFileType = Exclude<PreviewFileFilter, "all">;

export type PreviewTypeStats = {
  count: number;
  characters: number;
  lines: number;
};

export type PreviewStats = {
  totalFiles: number;
  totalCharacters: number;
  totalLines: number;
  keyFiles: number;
  byType: Record<PreviewFileType, PreviewTypeStats>;
};

export const previewFileFilterLabels = {
  all: "All",
  agent: "Agent",
  app: "App",
  config: "Config",
  docs: "Docs",
  env: "Env",
} satisfies Record<PreviewFileFilter, string>;

const emptyTypeStats = (): Record<PreviewFileType, PreviewTypeStats> => ({
  agent: { count: 0, characters: 0, lines: 0 },
  app: { count: 0, characters: 0, lines: 0 },
  config: { count: 0, characters: 0, lines: 0 },
  docs: { count: 0, characters: 0, lines: 0 },
  env: { count: 0, characters: 0, lines: 0 },
});

export function getPreviewStats(
  files: readonly PreviewGeneratedFile[],
): PreviewStats {
  const byType = emptyTypeStats();
  let totalCharacters = 0;
  let totalLines = 0;

  for (const file of files) {
    const type = getPreviewFileType(file);
    const characters = file.content.length;
    const lines = countLines(file.content);

    byType[type].count += 1;
    byType[type].characters += characters;
    byType[type].lines += lines;
    totalCharacters += characters;
    totalLines += lines;
  }

  return {
    totalFiles: files.length,
    totalCharacters,
    totalLines,
    keyFiles: getKeyFiles(files).length,
    byType,
  };
}

export function groupFilesByType(
  files: readonly PreviewGeneratedFile[],
): Record<PreviewFileType, PreviewGeneratedFile[]> {
  const groups: Record<PreviewFileType, PreviewGeneratedFile[]> = {
    agent: [],
    app: [],
    config: [],
    docs: [],
    env: [],
  };

  for (const file of files) {
    groups[getPreviewFileType(file)].push(file);
  }

  return groups;
}

export function filterPreviewFiles(
  files: readonly PreviewGeneratedFile[],
  filter: PreviewFileFilter,
): PreviewGeneratedFile[] {
  if (filter === "all") {
    return [...files];
  }

  return files.filter((file) => getPreviewFileType(file) === filter);
}

export function getKeyFiles(
  files: readonly PreviewGeneratedFile[],
): PreviewGeneratedFile[] {
  return files
    .map((file) => ({ file, rank: getKeyFileRank(file) }))
    .filter(
      (entry): entry is { file: PreviewGeneratedFile; rank: number } =>
        entry.rank !== null,
    )
    .sort((first, second) => {
      if (first.rank !== second.rank) {
        return first.rank - second.rank;
      }

      return first.file.path.localeCompare(second.file.path);
    })
    .map((entry) => entry.file);
}

export function getPreviewFileType(file: PreviewGeneratedFile): PreviewFileType {
  const path = normalizePath(file.path);
  const name = getBaseName(path);

  if (isAgentPath(path, name)) {
    return "agent";
  }

  if (isEnvPath(name)) {
    return "env";
  }

  if (isDocsPath(path, name)) {
    return "docs";
  }

  if (isConfigPath(path, name)) {
    return "config";
  }

  return "app";
}

export function getKeyFileLabel(file: PreviewGeneratedFile): string {
  const type = getPreviewFileType(file);
  const path = normalizePath(file.path);
  const name = getBaseName(path);

  if (type === "agent") {
    return "Agent instructions";
  }

  if (type === "env") {
    return "Environment sample";
  }

  if (name === "readme.md") {
    return "Project notes";
  }

  if (name === "package.json") {
    return "Package manifest";
  }

  if (isAppEntryPath(path, name)) {
    return "App entry";
  }

  if (type === "config") {
    return "Project config";
  }

  return previewFileFilterLabels[type];
}

function getKeyFileRank(file: PreviewGeneratedFile): number | null {
  const path = normalizePath(file.path);
  const name = getBaseName(path);

  if (name === "claude.md") {
    return 10;
  }

  if (name === "agent.md" || name === "agents.md") {
    return 11;
  }

  if (name === ".cursorrules" || path.startsWith(".cursor/rules/")) {
    return 12;
  }

  if (name === ".windsurfrules" || name === "windsurfrules") {
    return 13;
  }

  if (name === "copilot-instructions.md") {
    return 14;
  }

  if (name === "readme.md") {
    return 20;
  }

  if (isEnvPath(name)) {
    return 30;
  }

  if (name === "package.json") {
    return 40;
  }

  if (isAppEntryPath(path, name)) {
    return 50;
  }

  if (isConfigPath(path, name)) {
    return 60;
  }

  return null;
}

function normalizePath(path: string) {
  return path.trim().replace(/\\/g, "/").replace(/^\.\//, "").toLowerCase();
}

function getBaseName(path: string) {
  const parts = path.split("/");
  return parts[parts.length - 1] ?? path;
}

function countLines(content: string) {
  const normalized = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  if (normalized.length === 0) {
    return 0;
  }

  return normalized.endsWith("\n")
    ? normalized.split("\n").length - 1
    : normalized.split("\n").length;
}

function isAgentPath(path: string, name: string) {
  return (
    name === "claude.md" ||
    name === "agent.md" ||
    name === "agents.md" ||
    name === ".cursorrules" ||
    name === ".windsurfrules" ||
    name === "windsurfrules" ||
    name === "copilot-instructions.md" ||
    path.startsWith(".cursor/rules/")
  );
}

function isEnvPath(name: string) {
  return name === ".env" || name.startsWith(".env.");
}

function isDocsPath(path: string, name: string) {
  return (
    path.startsWith("docs/") ||
    name === "readme.md" ||
    name === "changelog.md" ||
    name === "contributing.md" ||
    name === "license" ||
    name === "license.md" ||
    name === "security.md" ||
    name.endsWith(".mdx") ||
    name.endsWith(".rst")
  );
}

function isConfigPath(path: string, name: string) {
  return (
    name === ".dockerignore" ||
    name === ".eslintrc" ||
    name === ".gitignore" ||
    name === ".npmrc" ||
    name === ".prettierrc" ||
    name === "components.json" ||
    name === "dockerfile" ||
    name === "eslint.config.js" ||
    name === "eslint.config.mjs" ||
    name === "eslint.config.ts" ||
    name === "next.config.js" ||
    name === "next.config.mjs" ||
    name === "next.config.ts" ||
    name === "package.json" ||
    name === "package-lock.json" ||
    name === "playwright.config.ts" ||
    name === "pnpm-lock.yaml" ||
    name === "postcss.config.js" ||
    name === "postcss.config.mjs" ||
    name === "prettier.config.js" ||
    name === "tailwind.config.js" ||
    name === "tailwind.config.ts" ||
    name === "tsconfig.json" ||
    name === "turbo.json" ||
    name === "vite.config.ts" ||
    name === "vitest.config.ts" ||
    name === "yarn.lock" ||
    path.startsWith(".github/workflows/") ||
    path.startsWith("prisma/") ||
    path.startsWith("supabase/config.")
  );
}

function isAppEntryPath(path: string, name: string) {
  return (
    path === "app/page.tsx" ||
    path === "pages/index.tsx" ||
    path === "src/app/page.tsx" ||
    path === "src/app/layout.tsx" ||
    path === "src/pages/index.tsx" ||
    path === "src/main.tsx" ||
    name === "app.tsx" ||
    name === "main.tsx"
  );
}
