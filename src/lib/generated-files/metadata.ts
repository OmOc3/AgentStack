import type {
  GeneratedFile,
  GeneratedFileCategory,
  GeneratedFileMetadata,
  GeneratedFileStats,
} from "./types";

const agentFileNames = new Set([
  "agent.md",
  "agents.md",
  "claude.md",
  "codex.md",
  ".cursorrules",
  ".windsurfrules",
]);

const docsFileNames = new Set([
  "readme",
  "readme.md",
  "changelog",
  "changelog.md",
  "contributing",
  "contributing.md",
  "license",
  "license.md",
]);

const configFileNames = new Set([
  ".dockerignore",
  ".editorconfig",
  ".eslintignore",
  ".eslintrc",
  ".gitattributes",
  ".gitignore",
  ".npmrc",
  ".nvmrc",
  ".prettierignore",
  ".prettierrc",
  "bun.lock",
  "bun.lockb",
  "components.json",
  "deno.json",
  "docker-compose.yml",
  "docker-compose.yaml",
  "dockerfile",
  "eslint.config.js",
  "eslint.config.mjs",
  "eslint.config.ts",
  "jsconfig.json",
  "next.config.js",
  "next.config.mjs",
  "next.config.ts",
  "package-lock.json",
  "package.json",
  "pnpm-lock.yaml",
  "postcss.config.js",
  "postcss.config.mjs",
  "postcss.config.ts",
  "prettier.config.js",
  "prettier.config.mjs",
  "prettier.config.ts",
  "tailwind.config.js",
  "tailwind.config.mjs",
  "tailwind.config.ts",
  "tsconfig.json",
  "vite.config.js",
  "vite.config.mjs",
  "vite.config.ts",
  "vitest.config.js",
  "vitest.config.mjs",
  "vitest.config.ts",
  "yarn.lock",
]);

export function classifyGeneratedFile(
  fileOrPath: GeneratedFile | string,
): GeneratedFileCategory {
  const path = normalizeGeneratedFilePath(
    typeof fileOrPath === "string" ? fileOrPath : fileOrPath.path,
  );
  const fileName = getFileName(path);

  if (isEnvFile(path, fileName)) {
    return "env";
  }

  if (isAgentFile(path, fileName)) {
    return "agent";
  }

  if (isDocsFile(path, fileName)) {
    return "docs";
  }

  if (isConfigFile(path, fileName)) {
    return "config";
  }

  return "app";
}

export function getGeneratedFileMetadata(
  file: GeneratedFile,
): GeneratedFileMetadata {
  return {
    path: file.path,
    category: classifyGeneratedFile(file),
    characterCount: file.content.length,
  };
}

export function getGeneratedFilesMetadata(
  files: readonly GeneratedFile[],
): GeneratedFileMetadata[] {
  return files.map((file) => getGeneratedFileMetadata(file));
}

export function countGeneratedFiles(files: readonly GeneratedFile[]) {
  return files.length;
}

export function countGeneratedFileCharacters(files: readonly GeneratedFile[]) {
  return files.reduce((total, file) => total + file.content.length, 0);
}

export function getGeneratedFileStats(
  files: readonly GeneratedFile[],
): GeneratedFileStats {
  return {
    totalFiles: countGeneratedFiles(files),
    totalCharacters: countGeneratedFileCharacters(files),
  };
}

export function areGeneratedFilesEqual(
  left: readonly GeneratedFile[],
  right: readonly GeneratedFile[],
) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((leftFile, index) => {
    const rightFile = right[index];

    return (
      rightFile !== undefined &&
      leftFile.path === rightFile.path &&
      leftFile.content === rightFile.content
    );
  });
}

function normalizeGeneratedFilePath(path: string) {
  return path
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\.\/+/, "")
    .replace(/\/+/g, "/")
    .toLowerCase();
}

function getFileName(path: string) {
  const parts = path.split("/");
  return parts[parts.length - 1] ?? path;
}

function isEnvFile(path: string, fileName: string) {
  return (
    fileName === ".env" ||
    fileName === ".env.example" ||
    fileName.startsWith(".env.") ||
    fileName.endsWith(".env") ||
    path.includes("/.env.")
  );
}

function isAgentFile(path: string, fileName: string) {
  return (
    agentFileNames.has(fileName) ||
    path.startsWith(".claude/") ||
    path.startsWith(".codex/") ||
    path.startsWith(".cursor/rules/") ||
    path === ".github/copilot-instructions.md"
  );
}

function isDocsFile(path: string, fileName: string) {
  return docsFileNames.has(fileName) || path.startsWith("docs/");
}

function isConfigFile(path: string, fileName: string) {
  return (
    configFileNames.has(fileName) ||
    path.startsWith(".github/") ||
    path.startsWith(".vscode/") ||
    fileName.endsWith(".config.js") ||
    fileName.endsWith(".config.mjs") ||
    fileName.endsWith(".config.ts") ||
    fileName.endsWith(".config.cjs")
  );
}
