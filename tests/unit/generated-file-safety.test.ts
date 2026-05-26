import assert from "node:assert/strict";
import test from "node:test";

import {
  DuplicateGeneratedPathError,
  GeneratedFileValidationError,
  assertNoDuplicatePaths,
  normalizeGeneratedPath,
  validateGeneratedFile,
  validateGeneratedFiles,
} from "../../src/lib/generated-files";

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
