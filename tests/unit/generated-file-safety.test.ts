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

      if (isModuleResolutionError(error) && shouldTryTypeScriptIndex(specifier)) {
        return nextResolve(`${specifier}/index.ts`, context);
      }

      throw error;
    }
  },
});

const generatedFileSafety = (await import(
  new URL("../../src/lib/generated-files/index.ts", import.meta.url).href
)) as typeof import("../../src/lib/generated-files");

const {
  DuplicateGeneratedPathError,
  GeneratedFileValidationError,
  assertNoDuplicatePaths,
  normalizeGeneratedPath,
  validateGeneratedFile,
  validateGeneratedFiles,
} = generatedFileSafety;

test("rejects path traversal and absolute generated file paths", () => {
  const dangerousPaths = [
    "",
    "   ",
    "/etc/passwd",
    "C:\\Users\\name\\.ssh\\id_rsa",
    "\\\\server\\share\\secret.txt",
    "../.env",
    "src/../.env",
    "docs/..hidden.md",
    ".git/config",
  ];

  for (const path of dangerousPaths) {
    const result = validateGeneratedFile({ content: "x", path });

    assert.equal(result.ok, false, path);
    assert.throws(
      () => normalizeGeneratedPath(path),
      GeneratedFileValidationError,
      path,
    );
  }
});

test("normalizes safe relative generated file paths", () => {
  assert.equal(normalizeGeneratedPath("./src//app\\page.tsx"), "src/app/page.tsx");
});

test("reports duplicate normalized generated file paths", () => {
  const files = [
    { content: "one", path: "src/app/page.tsx" },
    { content: "two", path: "src//app\\page.tsx" },
  ];

  const result = validateGeneratedFiles(files);

  assert.equal(result.ok, false);
  assert.deepEqual(
    result.issues.map((issue) => issue.code),
    ["DUPLICATE_PATH"],
  );
  assert.throws(() => assertNoDuplicatePaths(files), DuplicateGeneratedPathError);
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

function shouldTryTypeScriptIndex(specifier: string) {
  return specifier.startsWith(".") && !specifier.endsWith(".ts");
}
