import path from "node:path";

export type GeneratedTemplateFile = {
  path: string;
  content: string;
};

export type StackTemplateDefinition = {
  id: string;
  name: string;
};

export type StackTemplateValidationIssue = {
  code:
    | "duplicate-path"
    | "empty-content"
    | "env-example"
    | "generation-error"
    | "missing-file"
    | "package-json"
    | "required-script"
    | "unsafe-path";
  message: string;
  path?: string;
  stackId: string;
};

export type StackTemplateValidationResult = {
  fileCount: number;
  issues: StackTemplateValidationIssue[];
  stack: StackTemplateDefinition;
};

export type StackTemplateValidationSummary = {
  checkedFiles: number;
  checkedStacks: number;
  issues: StackTemplateValidationIssue[];
  results: StackTemplateValidationResult[];
};

type ScriptRequirement = {
  names: string[];
  reason: string;
  type: "all" | "one";
};

const requiredRootFiles = ["README.md", "package.json"] as const;
const ignoredEnvKeys = new Set(["NODE_ENV"]);

export function validateStackTemplates<TStack extends StackTemplateDefinition>({
  getFiles,
  stacks,
}: {
  getFiles: (stack: TStack) => readonly GeneratedTemplateFile[];
  stacks: readonly TStack[];
}): StackTemplateValidationSummary {
  const results = stacks.map((stack) => {
    try {
      const files = getFiles(stack);
      return validateStackFiles(stack, files);
    } catch (error) {
      return {
        fileCount: 0,
        issues: [
          createIssue(
            stack,
            "generation-error",
            `Could not generate files: ${formatError(error)}`,
          ),
        ],
        stack,
      };
    }
  });

  const issues = results.flatMap((result) => result.issues);
  const checkedFiles = results.reduce(
    (total, result) => total + result.fileCount,
    0,
  );

  return {
    checkedFiles,
    checkedStacks: results.length,
    issues,
    results,
  };
}

export function formatStackTemplateValidationReport(
  summary: StackTemplateValidationSummary,
) {
  const lines = ["AgentStack stack template validation", ""];

  for (const result of summary.results) {
    if (result.issues.length === 0) {
      lines.push(
        `[pass] ${result.stack.id} - ${pluralize(result.fileCount, "file")}`,
      );
      continue;
    }

    lines.push(
      `[fail] ${result.stack.id} - ${pluralize(
        result.fileCount,
        "file",
      )}, ${pluralize(result.issues.length, "issue")}`,
    );

    for (const issue of result.issues) {
      const location = issue.path ? `${issue.path}: ` : "";
      lines.push(`  - ${location}${issue.message}`);
    }
  }

  lines.push("");

  if (summary.issues.length === 0) {
    lines.push(
      `Checked ${pluralize(summary.checkedStacks, "stack")} and ${pluralize(
        summary.checkedFiles,
        "file",
      )}. No issues found.`,
    );
  } else {
    lines.push(
      `Checked ${pluralize(summary.checkedStacks, "stack")} and ${pluralize(
        summary.checkedFiles,
        "file",
      )}. Found ${pluralize(summary.issues.length, "issue")}.`,
    );
  }

  return lines.join("\n");
}

function validateStackFiles(
  stack: StackTemplateDefinition,
  files: readonly GeneratedTemplateFile[],
): StackTemplateValidationResult {
  const issues: StackTemplateValidationIssue[] = [];
  const filesByPath = new Map<string, GeneratedTemplateFile>();
  const seenPortablePaths = new Map<string, string>();

  for (const file of files) {
    const unsafeReason = getUnsafePathReason(file.path);

    if (unsafeReason) {
      issues.push(createIssue(stack, "unsafe-path", unsafeReason, file.path));
    } else {
      const normalizedPath = normalizeTemplatePath(file.path);

      if (filesByPath.has(normalizedPath)) {
        issues.push(
          createIssue(
            stack,
            "duplicate-path",
            "Duplicate generated file path.",
            file.path,
          ),
        );
      } else {
        filesByPath.set(normalizedPath, file);
      }

      const portablePath = normalizedPath.toLowerCase();
      const existingPortablePath = seenPortablePaths.get(portablePath);

      if (existingPortablePath && existingPortablePath !== normalizedPath) {
        issues.push(
          createIssue(
            stack,
            "duplicate-path",
            `Conflicts with ${existingPortablePath} on case-insensitive filesystems.`,
            file.path,
          ),
        );
      } else {
        seenPortablePaths.set(portablePath, normalizedPath);
      }
    }

    if (file.content.trim().length === 0) {
      issues.push(
        createIssue(
          stack,
          "empty-content",
          "Generated file content is empty.",
          file.path,
        ),
      );
    }
  }

  for (const requiredFile of requiredRootFiles) {
    if (!filesByPath.has(requiredFile)) {
      issues.push(
        createIssue(
          stack,
          "missing-file",
          `Missing required ${requiredFile}.`,
          requiredFile,
        ),
      );
    }
  }

  validateEnvExample(stack, filesByPath, issues);
  validatePackageJson(stack, filesByPath.get("package.json"), issues);

  return {
    fileCount: files.length,
    issues,
    stack,
  };
}

function validateEnvExample(
  stack: StackTemplateDefinition,
  filesByPath: ReadonlyMap<string, GeneratedTemplateFile>,
  issues: StackTemplateValidationIssue[],
) {
  const envReferences = collectEnvReferences(filesByPath);

  if (envReferences.size === 0) {
    return;
  }

  const envExample = filesByPath.get(".env.example");

  if (!envExample) {
    issues.push(
      createIssue(
        stack,
        "env-example",
        "Template references environment variables but does not include .env.example.",
        ".env.example",
      ),
    );
    return;
  }

  if (envExample.content.trim().length === 0) {
    issues.push(
      createIssue(
        stack,
        "env-example",
        ".env.example is empty even though the template references environment variables.",
        ".env.example",
      ),
    );
    return;
  }

  const documentedKeys = parseEnvExampleKeys(envExample.content);
  const missingKeys = [...envReferences].filter((key) => !documentedKeys.has(key));

  if (missingKeys.length > 0) {
    issues.push(
      createIssue(
        stack,
        "env-example",
        `.env.example is missing ${formatList(missingKeys)}.`,
        ".env.example",
      ),
    );
  }
}

function validatePackageJson(
  stack: StackTemplateDefinition,
  packageFile: GeneratedTemplateFile | undefined,
  issues: StackTemplateValidationIssue[],
) {
  if (!packageFile) {
    return;
  }

  let packageJson: unknown;

  try {
    packageJson = JSON.parse(packageFile.content);
  } catch (error) {
    issues.push(
      createIssue(
        stack,
        "package-json",
        `package.json is not valid JSON: ${formatError(error)}`,
        "package.json",
      ),
    );
    return;
  }

  if (!isRecord(packageJson)) {
    issues.push(
      createIssue(
        stack,
        "package-json",
        "package.json must contain a JSON object.",
        "package.json",
      ),
    );
    return;
  }

  const scripts = packageJson.scripts;

  if (!isRecord(scripts)) {
    issues.push(
      createIssue(
        stack,
        "package-json",
        "package.json scripts must be an object.",
        "package.json",
      ),
    );
    return;
  }

  for (const [scriptName, scriptCommand] of Object.entries(scripts)) {
    if (typeof scriptCommand !== "string" || scriptCommand.trim().length === 0) {
      issues.push(
        createIssue(
          stack,
          "package-json",
          `Script "${scriptName}" must be a non-empty string.`,
          "package.json",
        ),
      );
    }
  }

  for (const requirement of getScriptRequirements(packageJson)) {
    const missingScripts = requirement.names.filter(
      (scriptName) => !(scriptName in scripts),
    );

    if (requirement.type === "all" && missingScripts.length > 0) {
      issues.push(
        createIssue(
          stack,
          "required-script",
          `Missing ${formatList(missingScripts)} ${requirement.reason}.`,
          "package.json",
        ),
      );
    }

    if (
      requirement.type === "one" &&
      requirement.names.every((scriptName) => !(scriptName in scripts))
    ) {
      issues.push(
        createIssue(
          stack,
          "required-script",
          `Missing one of ${formatList(requirement.names)} ${requirement.reason}.`,
          "package.json",
        ),
      );
    }
  }
}

function getScriptRequirements(packageJson: Record<string, unknown>) {
  const dependencies = getDependencyNames(packageJson);
  const requirements: ScriptRequirement[] = [];

  if (dependencies.has("next")) {
    requirements.push({
      names: ["dev", "build", "start"],
      reason: "for a Next.js template.",
      type: "all",
    });
  } else if (dependencies.has("expo")) {
    requirements.push({
      names: ["dev", "android", "ios", "web"],
      reason: "for an Expo template.",
      type: "all",
    });
  } else if (dependencies.has("@sveltejs/kit")) {
    requirements.push({
      names: ["dev", "build", "preview"],
      reason: "for a SvelteKit template.",
      type: "all",
    });
  } else if (
    dependencies.has("@remix-run/react") ||
    dependencies.has("@remix-run/dev")
  ) {
    requirements.push({
      names: ["dev", "build", "start"],
      reason: "for a Remix template.",
      type: "all",
    });
  } else if (dependencies.has("astro")) {
    requirements.push({
      names: ["dev", "build", "preview"],
      reason: "for an Astro template.",
      type: "all",
    });
  } else {
    requirements.push({
      names: ["dev"],
      reason: "for local development.",
      type: "all",
    });
  }

  if (dependencies.has("drizzle-kit") || dependencies.has("drizzle-orm")) {
    requirements.push({
      names: ["db:generate", "db:migrate"],
      reason: "for Drizzle database changes.",
      type: "all",
    });
  }

  if (dependencies.has("prisma") || dependencies.has("@prisma/client")) {
    requirements.push({
      names: ["db:generate"],
      reason: "for Prisma client generation.",
      type: "all",
    });
    requirements.push({
      names: ["db:push", "db:migrate"],
      reason: "for applying Prisma schema changes.",
      type: "one",
    });
  }

  return requirements;
}

function collectEnvReferences(
  filesByPath: ReadonlyMap<string, GeneratedTemplateFile>,
) {
  const references = new Set<string>();
  const envPatterns = [
    /\bprocess\.env\.([A-Z_][A-Z0-9_]*)\b/g,
    /\bprocess\.env\[['"`]([A-Z_][A-Z0-9_]*)['"`]\]/g,
    /\bimport\.meta\.env\.([A-Z_][A-Z0-9_]*)\b/g,
    /\bDeno\.env\.get\(\s*['"`]([A-Z_][A-Z0-9_]*)['"`]\s*\)/g,
    /\benv\(\s*['"`]([A-Z_][A-Z0-9_]*)['"`]\s*\)/g,
  ];

  for (const [filePath, file] of filesByPath) {
    if (filePath === ".env.example") {
      continue;
    }

    for (const pattern of envPatterns) {
      pattern.lastIndex = 0;

      for (const match of file.content.matchAll(pattern)) {
        const envKey = match[1];

        if (envKey && !ignoredEnvKeys.has(envKey)) {
          references.add(envKey);
        }
      }
    }
  }

  return references;
}

function parseEnvExampleKeys(content: string) {
  const keys = new Set<string>();

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/.exec(trimmed);

    if (match?.[1]) {
      keys.add(match[1]);
    }
  }

  return keys;
}

function getDependencyNames(packageJson: Record<string, unknown>) {
  const dependencies = new Set<string>();

  for (const field of ["dependencies", "devDependencies"] as const) {
    const dependencyRecord = packageJson[field];

    if (!isRecord(dependencyRecord)) {
      continue;
    }

    for (const dependencyName of Object.keys(dependencyRecord)) {
      dependencies.add(dependencyName);
    }
  }

  return dependencies;
}

function getUnsafePathReason(filePath: string) {
  if (filePath.length === 0) {
    return "File path is empty.";
  }

  if (filePath.trim() !== filePath) {
    return "File path has leading or trailing whitespace.";
  }

  if (filePath.includes("\0")) {
    return "File path contains a null byte.";
  }

  if (filePath.includes("\\")) {
    return "File path must use POSIX separators.";
  }

  if (filePath.startsWith("/") || filePath.startsWith("~")) {
    return "File path must be relative.";
  }

  if (/^[A-Za-z]:\//.test(filePath)) {
    return "File path must not use a Windows drive prefix.";
  }

  const segments = filePath.split("/");

  if (segments.some((segment) => segment.length === 0)) {
    return "File path contains an empty segment.";
  }

  if (segments.some((segment) => segment === "." || segment === "..")) {
    return "File path must not contain . or .. segments.";
  }

  if (path.posix.normalize(filePath) !== filePath) {
    return "File path is not normalized.";
  }

  return null;
}

function normalizeTemplatePath(filePath: string) {
  return path.posix.normalize(filePath);
}

function createIssue(
  stack: StackTemplateDefinition,
  code: StackTemplateValidationIssue["code"],
  message: string,
  filePath?: string,
): StackTemplateValidationIssue {
  const issue: StackTemplateValidationIssue = {
    code,
    message,
    stackId: stack.id,
  };

  if (filePath !== undefined) {
    issue.path = filePath;
  }

  return issue;
}

function formatError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function formatList(values: readonly string[]) {
  if (values.length === 0) {
    return "";
  }

  if (values.length === 1) {
    return values[0] ?? "";
  }

  return values.map((value) => `"${value}"`).join(", ");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pluralize(count: number, singular: string) {
  return `${count} ${count === 1 ? singular : `${singular}s`}`;
}
