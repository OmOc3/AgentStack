import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import test from "node:test";

registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (isModuleNotFoundError(error) && shouldTryTypeScriptFile(specifier)) {
        return nextResolve(`${specifier}.ts`, context);
      }

      throw error;
    }
  },
});

const previewSessionModule = (await import(
  new URL("../../src/lib/preview-session/index.ts", import.meta.url).href
)) as typeof import("../../src/lib/preview-session");
const generatedFileMetadataModule = (await import(
  new URL("../../src/lib/generated-files/metadata.ts", import.meta.url).href
)) as typeof import("../../src/lib/generated-files/metadata");

const {
  DEFAULT_PREVIEW_SESSION_TTL_MS,
  PreviewSessionExpiredError,
  PreviewSessionMismatchError,
  PreviewSessionNotFoundError,
  createMemoryPreviewSessionStore,
} = previewSessionModule;
const {
  classifyGeneratedFile,
  countGeneratedFileCharacters,
  countGeneratedFiles,
  getGeneratedFileStats,
} = generatedFileMetadataModule;

test("stores preview sessions with cloned files and a safe default TTL", () => {
  const currentTime = 1_000;
  const sourceFiles = [{ path: "README.md", content: "Hello" }];
  const store = createMemoryPreviewSessionStore({
    createId: () => "session-1",
    now: () => currentTime,
  });

  const session = store.createSession({
    projectName: "demo-app",
    stackId: "next-tailwind",
    files: sourceFiles,
  });

  assert.equal(session.id, "session-1");
  assert.equal(session.createdAt, currentTime);
  assert.equal(session.expiresAt, currentTime + DEFAULT_PREVIEW_SESSION_TTL_MS);

  sourceFiles[0]!.content = "Changed after create";
  assert.equal(store.getSession(session.id).files[0]?.content, "Hello");

  const fetchedSession = store.getSession(session.id);
  (fetchedSession.files as unknown as { content: string }[])[0]!.content =
    "Changed after read";

  assert.equal(store.getSession(session.id).files[0]?.content, "Hello");
});

test("expires preview sessions and removes them from the store", () => {
  let currentTime = 1_000;
  let sessionCount = 0;
  const store = createMemoryPreviewSessionStore({
    createId: () => `session-${(sessionCount += 1)}`,
    now: () => currentTime,
  });
  const session = store.createSession({
    projectName: "demo-app",
    stackId: "next-tailwind",
    files: [{ path: "README.md", content: "Hello" }],
    ttlMs: 5,
  });
  const cleanupSession = store.createSession({
    projectName: "cleanup-app",
    stackId: "next-tailwind",
    files: [{ path: "README.md", content: "Hello" }],
    ttlMs: 5,
  });

  currentTime = 1_005;

  assert.throws(() => store.getSession(session.id), PreviewSessionExpiredError);
  assert.throws(() => store.getSession(session.id), PreviewSessionNotFoundError);
  assert.equal(store.cleanupExpiredSessions(), 1);
  assert.throws(
    () => store.getSession(cleanupSession.id),
    PreviewSessionNotFoundError,
  );
});

test("validates project, stack, options, and exact file content", () => {
  const store = createMemoryPreviewSessionStore({
    createId: () => "session-1",
    now: () => 1_000,
  });
  const files = [{ path: "README.md", content: "Hello" }];
  const session = store.createSession({
    projectName: "demo-app",
    stackId: "next-tailwind",
    files,
    generationOptions: { template: "default" },
  });

  assert.deepEqual(
    store.validateSessionMatch({
      id: session.id,
      projectName: "demo-app",
      stackId: "next-tailwind",
      files,
      generationOptions: { template: "default" },
    }).files,
    files,
  );

  assert.throws(
    () =>
      store.validateSessionMatch({
        id: session.id,
        projectName: "other-app",
        stackId: "next-tailwind",
      }),
    (error) =>
      error instanceof PreviewSessionMismatchError &&
      error.reason === "projectName",
  );
  assert.throws(
    () =>
      store.validateSessionMatch({
        id: session.id,
        projectName: "demo-app",
        stackId: "next-tailwind",
        files: [{ path: "README.md", content: "Different" }],
      }),
    (error) =>
      error instanceof PreviewSessionMismatchError && error.reason === "files",
  );
});

test("classifies generated files and counts simple metadata", () => {
  assert.equal(classifyGeneratedFile("CLAUDE.md"), "agent");
  assert.equal(classifyGeneratedFile(".env.example"), "env");
  assert.equal(classifyGeneratedFile("next.config.ts"), "config");
  assert.equal(classifyGeneratedFile("README.md"), "docs");
  assert.equal(classifyGeneratedFile("src/app/page.tsx"), "app");

  const files = [
    { path: "README.md", content: "Hello" },
    { path: "src/app/page.tsx", content: "World!" },
  ];

  assert.equal(countGeneratedFiles(files), 2);
  assert.equal(countGeneratedFileCharacters(files), 11);
  assert.deepEqual(getGeneratedFileStats(files), {
    totalCharacters: 11,
    totalFiles: 2,
  });
});

function isModuleNotFoundError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ERR_MODULE_NOT_FOUND"
  );
}

function shouldTryTypeScriptFile(specifier: string) {
  return specifier.startsWith(".") && !specifier.endsWith(".ts");
}
