import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_PREVIEW_SESSION_TTL_MS,
  PreviewSessionExpiredError,
  PreviewSessionMismatchError,
  PreviewSessionNotFoundError,
  createMemoryPreviewSessionStore,
} from "../../src/lib/preview-session";
import {
  classifyGeneratedFile,
  countGeneratedFileCharacters,
  countGeneratedFiles,
  getGeneratedFileStats,
} from "../../src/lib/generated-files/metadata";

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
