import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import test from "node:test";

registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (isModuleResolutionError(error) && shouldTryTypeScriptFile(specifier)) {
        return nextResolve(`${specifier}.ts`, context);
      }

      throw error;
    }
  },
});

const filePreviewModule = (await import(
  new URL("../../src/lib/file-preview/utils.ts", import.meta.url).href
)) as typeof import("../../src/lib/file-preview/utils");
const {
  filterPreviewFiles,
  getKeyFiles,
  getPreviewFileType,
  getPreviewStats,
  groupFilesByType,
} = filePreviewModule;

type PreviewFileType = import("../../src/lib/file-preview/utils").PreviewFileType;
type PreviewGeneratedFile =
  import("../../src/lib/file-preview/utils").PreviewGeneratedFile;

test("classifies generated files with stable precedence", () => {
  const cases: Array<[PreviewGeneratedFile, PreviewFileType]> = [
    [{ content: "agent", path: "CLAUDE.md" }, "agent"],
    [{ content: "agent", path: ".cursor/rules/project.mdc" }, "agent"],
    [{ content: "env", path: ".env.example" }, "env"],
    [{ content: "docs", path: "README.md" }, "docs"],
    [{ content: "docs", path: "docs/setup.md" }, "docs"],
    [{ content: "config", path: "package.json" }, "config"],
    [{ content: "config", path: ".github/workflows/ci.yml" }, "config"],
    [{ content: "app", path: "src/app/page.tsx" }, "app"],
  ];

  for (const [file, expectedType] of cases) {
    assert.equal(getPreviewFileType(file), expectedType, file.path);
  }
});

test("groups and filters use the same classifier", () => {
  const files: PreviewGeneratedFile[] = [
    { content: "agent", path: "AGENT.md" },
    { content: "app", path: "src/lib/data.ts" },
    { content: "config", path: "next.config.ts" },
    { content: "docs", path: "CONTRIBUTING.md" },
    { content: "env", path: ".env.local" },
  ];

  const groups = groupFilesByType(files);

  assert.deepEqual(filterPreviewFiles(files, "agent"), groups.agent);
  assert.deepEqual(filterPreviewFiles(files, "app"), groups.app);
  assert.deepEqual(filterPreviewFiles(files, "config"), groups.config);
  assert.deepEqual(filterPreviewFiles(files, "docs"), groups.docs);
  assert.deepEqual(filterPreviewFiles(files, "env"), groups.env);
  assert.deepEqual(filterPreviewFiles(files, "all"), files);
});

test("reports stats and key files without reordering ordinary files", () => {
  const files: PreviewGeneratedFile[] = [
    { content: "one\ntwo\n", path: "CLAUDE.md" },
    { content: "Read this", path: "README.md" },
    { content: "A=1\nB=2", path: ".env.example" },
    { content: "{}", path: "package.json" },
    { content: "export default function Page() {}", path: "src/app/page.tsx" },
    { content: "", path: "src/lib/data.ts" },
  ];

  const stats = getPreviewStats(files);

  assert.equal(stats.totalFiles, 6);
  assert.equal(stats.totalLines, 7);
  assert.equal(stats.byType.agent.count, 1);
  assert.equal(stats.byType.app.count, 2);
  assert.equal(stats.byType.config.count, 1);
  assert.equal(stats.byType.docs.count, 1);
  assert.equal(stats.byType.env.count, 1);
  assert.equal(stats.keyFiles, 5);
  assert.deepEqual(
    getKeyFiles(files).map((file) => file.path),
    [
      "CLAUDE.md",
      "README.md",
      ".env.example",
      "package.json",
      "src/app/page.tsx",
    ],
  );
});

function isModuleResolutionError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error.code === "ERR_MODULE_NOT_FOUND" ||
      error.code === "ERR_UNSUPPORTED_DIR_IMPORT")
  );
}

function shouldTryTypeScriptFile(specifier: string) {
  return specifier.startsWith(".") && !specifier.endsWith(".ts");
}
