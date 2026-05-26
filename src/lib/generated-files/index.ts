export const MAX_GENERATED_FILE_SIZE_BYTES = 512 * 1024;

const MAX_GENERATED_PATH_LENGTH = 240;
const BINARY_SAMPLE_SIZE = 4096;
const BINARY_CONTROL_CHAR_LIMIT = 8;
const BINARY_CONTROL_CHAR_RATIO = 0.01;
const WINDOWS_OR_SCHEME_PATH_PATTERN = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;

export type GeneratedFileInput = {
  path: string;
  content: string;
};

export type GeneratedFileKind =
  | "asset"
  | "config"
  | "data"
  | "documentation"
  | "other"
  | "source"
  | "style"
  | "test";

export type SafeGeneratedFile = GeneratedFileInput & {
  kind: GeneratedFileKind;
  sizeBytes: number;
};

export type GeneratedFileValidationIssueCode =
  | "ABSOLUTE_PATH"
  | "BINARY_CONTENT"
  | "DIRECTORY_PATH"
  | "DUPLICATE_PATH"
  | "EMPTY_PATH"
  | "FILE_TOO_LARGE"
  | "INVALID_CONTENT"
  | "INVALID_FILE"
  | "INVALID_PATH"
  | "PATH_TOO_LONG"
  | "PATH_TRAVERSAL";

export type GeneratedFileValidationIssue = {
  code: GeneratedFileValidationIssueCode;
  message: string;
  actualBytes?: number;
  duplicateIndex?: number;
  firstIndex?: number;
  index?: number;
  limitBytes?: number;
  normalizedPath?: string;
  path?: string;
};

export type GeneratedFileValidationResult =
  | {
      file: SafeGeneratedFile;
      issues: [];
      ok: true;
    }
  | {
      issues: GeneratedFileValidationIssue[];
      ok: false;
    };

export type GeneratedFilesValidationResult =
  | {
      files: SafeGeneratedFile[];
      issues: [];
      ok: true;
      stats: GeneratedFileStats;
    }
  | {
      files: SafeGeneratedFile[];
      issues: GeneratedFileValidationIssue[];
      ok: false;
      stats: GeneratedFileStats;
    };

export type GeneratedFileStats = {
  byKind: Record<GeneratedFileKind, GeneratedFileKindStats>;
  fileCount: number;
  largestFile: {
    path: string;
    sizeBytes: number;
  } | null;
  totalSizeBytes: number;
};

export type GeneratedFileKindStats = {
  count: number;
  sizeBytes: number;
};

export type DuplicateGeneratedPath = {
  duplicateIndex: number;
  firstIndex: number;
  path: string;
};

export type GeneratedFileValidationOptions = {
  maxSizeBytes?: number;
};

export class GeneratedFileValidationError extends Error {
  readonly code: GeneratedFileValidationIssueCode;
  readonly issue: GeneratedFileValidationIssue;

  constructor(issue: GeneratedFileValidationIssue) {
    super(issue.message);
    this.name = "GeneratedFileValidationError";
    this.code = issue.code;
    this.issue = issue;
  }
}

export class GeneratedFilesValidationError extends Error {
  readonly issues: GeneratedFileValidationIssue[];

  constructor(issues: GeneratedFileValidationIssue[], message?: string) {
    super(message ?? getValidationErrorMessage(issues));
    this.name = "GeneratedFilesValidationError";
    this.issues = issues;
  }
}

export class DuplicateGeneratedPathError extends GeneratedFilesValidationError {
  readonly duplicates: DuplicateGeneratedPath[];

  constructor(duplicates: DuplicateGeneratedPath[]) {
    super(
      duplicates.map((duplicate) => ({
        code: "DUPLICATE_PATH",
        duplicateIndex: duplicate.duplicateIndex,
        firstIndex: duplicate.firstIndex,
        message: `Duplicate generated file path: ${duplicate.path}.`,
        normalizedPath: duplicate.path,
        path: duplicate.path,
      })),
      getDuplicatePathErrorMessage(duplicates),
    );
    this.name = "DuplicateGeneratedPathError";
    this.duplicates = duplicates;
  }
}

export function normalizeGeneratedPath(path: string) {
  const rawPath = path.trim();

  if (!rawPath) {
    throw new GeneratedFileValidationError(
      createIssue("EMPTY_PATH", "Generated file path cannot be empty.", path),
    );
  }

  if (rawPath.includes("\0")) {
    throw new GeneratedFileValidationError(
      createIssue("INVALID_PATH", "Generated file path contains a null byte.", path),
    );
  }

  const slashPath = rawPath.replaceAll("\\", "/");

  if (
    slashPath.startsWith("/") ||
    slashPath.startsWith("//") ||
    WINDOWS_OR_SCHEME_PATH_PATTERN.test(slashPath)
  ) {
    throw new GeneratedFileValidationError(
      createIssue(
        "ABSOLUTE_PATH",
        "Generated file path must be relative.",
        path,
      ),
    );
  }

  if (slashPath.includes("..")) {
    throw new GeneratedFileValidationError(
      createIssue(
        "PATH_TRAVERSAL",
        "Generated file path cannot contain '..'.",
        path,
      ),
    );
  }

  if (slashPath.endsWith("/")) {
    throw new GeneratedFileValidationError(
      createIssue(
        "DIRECTORY_PATH",
        "Generated file path must point to a file.",
        path,
      ),
    );
  }

  const normalizedPath = slashPath
    .replace(/\/+/g, "/")
    .split("/")
    .filter((part) => part !== "" && part !== ".")
    .join("/");

  if (!normalizedPath) {
    throw new GeneratedFileValidationError(
      createIssue("EMPTY_PATH", "Generated file path cannot be empty.", path),
    );
  }

  if (normalizedPath.length > MAX_GENERATED_PATH_LENGTH) {
    const issue = createIssue(
      "PATH_TOO_LONG",
      `Generated file path must be ${MAX_GENERATED_PATH_LENGTH} characters or less.`,
      path,
      normalizedPath,
    );

    throw new GeneratedFileValidationError(issue);
  }

  if (normalizedPath.split("/")[0]?.toLowerCase() === ".git") {
    throw new GeneratedFileValidationError(
      createIssue(
        "INVALID_PATH",
        "Generated file path cannot write inside .git.",
        path,
        normalizedPath,
      ),
    );
  }

  return normalizedPath;
}

export function validateGeneratedFile(
  file: unknown,
  options: GeneratedFileValidationOptions = {},
): GeneratedFileValidationResult {
  const issues: GeneratedFileValidationIssue[] = [];
  const maxSizeBytes = getMaxSizeBytes(options);

  if (!isRecord(file)) {
    return {
      issues: [
        {
          code: "INVALID_FILE",
          message: "Generated file must be an object.",
        },
      ],
      ok: false,
    };
  }

  const { content, path } = file;
  let normalizedPath = "";
  let sizeBytes = 0;
  let safeContent = "";

  if (typeof path !== "string") {
    issues.push({
      code: "INVALID_PATH",
      message: "Generated file path must be a string.",
    });
  } else {
    try {
      normalizedPath = normalizeGeneratedPath(path);
    } catch (error) {
      if (error instanceof GeneratedFileValidationError) {
        issues.push(error.issue);
      } else {
        throw error;
      }
    }
  }

  if (typeof content !== "string") {
    issues.push({
      code: "INVALID_CONTENT",
      message: "Generated file content must be a string.",
    });
  } else {
    safeContent = content;
    sizeBytes = getContentSizeBytes(content);

    if (sizeBytes > maxSizeBytes) {
      const issue: GeneratedFileValidationIssue = {
        actualBytes: sizeBytes,
        code: "FILE_TOO_LARGE",
        limitBytes: maxSizeBytes,
        message: `Generated file content must be ${maxSizeBytes.toLocaleString()} bytes or less.`,
      };

      if (typeof path === "string") {
        issue.path = path;
      }

      if (normalizedPath) {
        issue.normalizedPath = normalizedPath;
      }

      issues.push(issue);
    }

    const binaryReason = getBinaryContentReason(content);

    if (binaryReason) {
      const issue: GeneratedFileValidationIssue = {
        code: "BINARY_CONTENT",
        message: binaryReason,
      };

      if (typeof path === "string") {
        issue.path = path;
      }

      if (normalizedPath) {
        issue.normalizedPath = normalizedPath;
      }

      issues.push(issue);
    }
  }

  if (issues.length > 0) {
    return { issues, ok: false };
  }

  return {
    file: {
      content: safeContent,
      kind: classifyNormalizedGeneratedFile(normalizedPath),
      path: normalizedPath,
      sizeBytes,
    },
    issues: [],
    ok: true,
  };
}

export function validateGeneratedFiles(
  files: unknown,
  options: GeneratedFileValidationOptions = {},
): GeneratedFilesValidationResult {
  if (!Array.isArray(files)) {
    const issues: GeneratedFileValidationIssue[] = [
      {
        code: "INVALID_FILE",
        message: "Generated files must be an array.",
      },
    ];

    return {
      files: [],
      issues,
      ok: false,
      stats: createGeneratedFileStats([]),
    };
  }

  const validFiles: SafeGeneratedFile[] = [];
  const issues: GeneratedFileValidationIssue[] = [];
  const seenPaths = new Map<string, number>();

  files.forEach((file, index) => {
    const result = validateGeneratedFile(file, options);

    if (!result.ok) {
      issues.push(...result.issues.map((issue) => withIssueIndex(issue, index)));
      return;
    }

    const firstIndex = seenPaths.get(result.file.path);

    if (firstIndex !== undefined) {
      issues.push({
        code: "DUPLICATE_PATH",
        duplicateIndex: index,
        firstIndex,
        index,
        message: `Duplicate generated file path: ${result.file.path}.`,
        normalizedPath: result.file.path,
        path: result.file.path,
      });
    } else {
      seenPaths.set(result.file.path, index);
    }

    validFiles.push(result.file);
  });

  const stats = createGeneratedFileStats(validFiles);

  if (issues.length > 0) {
    return {
      files: validFiles,
      issues,
      ok: false,
      stats,
    };
  }

  return {
    files: validFiles,
    issues: [],
    ok: true,
    stats,
  };
}

export function assertNoDuplicatePaths(
  files: ReadonlyArray<Pick<GeneratedFileInput, "path">>,
) {
  const duplicates = findDuplicateGeneratedPaths(files);

  if (duplicates.length > 0) {
    throw new DuplicateGeneratedPathError(duplicates);
  }
}

export function classifyGeneratedFile(path: string): GeneratedFileKind {
  return classifyNormalizedGeneratedFile(normalizeGeneratedPath(path));
}

export function getGeneratedFileStats(
  files: ReadonlyArray<GeneratedFileInput>,
): GeneratedFileStats {
  return createGeneratedFileStats(
    files.map((file) => {
      const normalizedPath = normalizeGeneratedPath(file.path);

      return {
        content: file.content,
        kind: classifyNormalizedGeneratedFile(normalizedPath),
        path: normalizedPath,
        sizeBytes: getContentSizeBytes(file.content),
      };
    }),
  );
}

function findDuplicateGeneratedPaths(
  files: ReadonlyArray<Pick<GeneratedFileInput, "path">>,
) {
  const duplicates: DuplicateGeneratedPath[] = [];
  const seenPaths = new Map<string, number>();

  files.forEach((file, index) => {
    const normalizedPath = normalizeGeneratedPath(file.path);
    const firstIndex = seenPaths.get(normalizedPath);

    if (firstIndex === undefined) {
      seenPaths.set(normalizedPath, index);
      return;
    }

    duplicates.push({
      duplicateIndex: index,
      firstIndex,
      path: normalizedPath,
    });
  });

  return duplicates;
}

function createGeneratedFileStats(files: SafeGeneratedFile[]): GeneratedFileStats {
  const stats: GeneratedFileStats = {
    byKind: createEmptyKindStats(),
    fileCount: files.length,
    largestFile: null,
    totalSizeBytes: 0,
  };

  for (const file of files) {
    stats.totalSizeBytes += file.sizeBytes;
    stats.byKind[file.kind].count += 1;
    stats.byKind[file.kind].sizeBytes += file.sizeBytes;

    if (!stats.largestFile || file.sizeBytes > stats.largestFile.sizeBytes) {
      stats.largestFile = {
        path: file.path,
        sizeBytes: file.sizeBytes,
      };
    }
  }

  return stats;
}

function createEmptyKindStats(): Record<GeneratedFileKind, GeneratedFileKindStats> {
  return {
    asset: { count: 0, sizeBytes: 0 },
    config: { count: 0, sizeBytes: 0 },
    data: { count: 0, sizeBytes: 0 },
    documentation: { count: 0, sizeBytes: 0 },
    other: { count: 0, sizeBytes: 0 },
    source: { count: 0, sizeBytes: 0 },
    style: { count: 0, sizeBytes: 0 },
    test: { count: 0, sizeBytes: 0 },
  };
}

function classifyNormalizedGeneratedFile(path: string): GeneratedFileKind {
  const lowerPath = path.toLowerCase();
  const fileName = getFileName(lowerPath);
  const extension = getFileExtension(fileName);

  if (
    lowerPath.startsWith("tests/") ||
    lowerPath.includes("/tests/") ||
    lowerPath.includes("/__tests__/") ||
    fileName.includes(".spec.") ||
    fileName.includes(".test.")
  ) {
    return "test";
  }

  if (documentationExtensions.has(extension) || documentationFiles.has(fileName)) {
    return "documentation";
  }

  if (
    fileName.startsWith(".") ||
    configFiles.has(fileName) ||
    configExtensions.has(extension) ||
    fileName.includes(".config.") ||
    fileName.includes(".conf.")
  ) {
    return "config";
  }

  if (sourceExtensions.has(extension)) {
    return "source";
  }

  if (styleExtensions.has(extension)) {
    return "style";
  }

  if (assetExtensions.has(extension)) {
    return "asset";
  }

  if (dataExtensions.has(extension)) {
    return "data";
  }

  return "other";
}

function getBinaryContentReason(content: string) {
  if (content.includes("\0")) {
    return "Generated file content appears to contain binary data.";
  }

  const sample = content.slice(0, BINARY_SAMPLE_SIZE);
  let controlChars = 0;
  let replacementChars = 0;

  for (let index = 0; index < sample.length; index += 1) {
    const charCode = sample.charCodeAt(index);

    if (charCode === 0xfffd) {
      replacementChars += 1;
      continue;
    }

    if (isSuspiciousControlChar(charCode)) {
      controlChars += 1;
    }
  }

  const suspiciousCount = controlChars + replacementChars;

  if (
    suspiciousCount >= BINARY_CONTROL_CHAR_LIMIT &&
    suspiciousCount / sample.length > BINARY_CONTROL_CHAR_RATIO
  ) {
    return "Generated file content has too many control characters to treat as text.";
  }

  return null;
}

function isSuspiciousControlChar(charCode: number) {
  return (
    (charCode >= 0 && charCode <= 8) ||
    charCode === 11 ||
    charCode === 12 ||
    (charCode >= 14 && charCode <= 31) ||
    charCode === 127
  );
}

function getContentSizeBytes(content: string) {
  return new TextEncoder().encode(content).byteLength;
}

function getMaxSizeBytes(options: GeneratedFileValidationOptions) {
  const maxSizeBytes = options.maxSizeBytes ?? MAX_GENERATED_FILE_SIZE_BYTES;

  if (!Number.isFinite(maxSizeBytes) || maxSizeBytes <= 0) {
    throw new Error("maxSizeBytes must be a positive number.");
  }

  return maxSizeBytes;
}

function withIssueIndex(
  issue: GeneratedFileValidationIssue,
  index: number,
): GeneratedFileValidationIssue {
  return {
    ...issue,
    index,
  };
}

function createIssue(
  code: GeneratedFileValidationIssueCode,
  message: string,
  path?: string,
  normalizedPath?: string,
): GeneratedFileValidationIssue {
  const issue: GeneratedFileValidationIssue = {
    code,
    message,
  };

  if (path !== undefined) {
    issue.path = path;
  }

  if (normalizedPath !== undefined) {
    issue.normalizedPath = normalizedPath;
  }

  return issue;
}

function getDuplicatePathErrorMessage(duplicates: DuplicateGeneratedPath[]) {
  const paths = duplicates.map((duplicate) => duplicate.path).join(", ");

  return `Generated files contain duplicate paths: ${paths}.`;
}

function getValidationErrorMessage(issues: GeneratedFileValidationIssue[]) {
  if (issues.length === 0) {
    return "Generated file validation failed.";
  }

  return issues.map((issue) => issue.message).join(" ");
}

function getFileName(path: string) {
  return path.split("/").at(-1) ?? path;
}

function getFileExtension(fileName: string) {
  const dotIndex = fileName.lastIndexOf(".");

  if (dotIndex <= 0) {
    return "";
  }

  return fileName.slice(dotIndex);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

const sourceExtensions = new Set([
  ".astro",
  ".cjs",
  ".cs",
  ".go",
  ".java",
  ".js",
  ".jsx",
  ".kt",
  ".mjs",
  ".php",
  ".py",
  ".rb",
  ".rs",
  ".svelte",
  ".swift",
  ".ts",
  ".tsx",
  ".vue",
]);

const styleExtensions = new Set([
  ".css",
  ".less",
  ".sass",
  ".scss",
]);

const documentationExtensions = new Set([
  ".adoc",
  ".md",
  ".mdx",
  ".rst",
  ".txt",
]);

const configExtensions = new Set([
  ".env",
  ".ini",
  ".toml",
  ".yml",
  ".yaml",
]);

const dataExtensions = new Set([
  ".csv",
  ".json",
  ".jsonl",
  ".xml",
]);

const assetExtensions = new Set([
  ".gif",
  ".ico",
  ".jpeg",
  ".jpg",
  ".otf",
  ".png",
  ".svg",
  ".ttf",
  ".webp",
  ".woff",
  ".woff2",
]);

const documentationFiles = new Set([
  "changelog",
  "license",
  "readme",
]);

const configFiles = new Set([
  "components.json",
  "dockerfile",
  "eslint.config.js",
  "eslint.config.mjs",
  "eslint.config.ts",
  "next.config.js",
  "next.config.mjs",
  "next.config.ts",
  "package-lock.json",
  "package.json",
  "pnpm-lock.yaml",
  "postcss.config.js",
  "postcss.config.mjs",
  "postcss.config.ts",
  "tailwind.config.js",
  "tailwind.config.mjs",
  "tailwind.config.ts",
  "tsconfig.json",
  "vite.config.js",
  "vite.config.mjs",
  "vite.config.ts",
  "yarn.lock",
]);
