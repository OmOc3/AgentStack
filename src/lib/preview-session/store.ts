import { areGeneratedFilesEqual } from "../generated-files/metadata";
import type { GeneratedFile } from "../generated-files/types";

import {
  PreviewSessionExpiredError,
  PreviewSessionMismatchError,
  PreviewSessionNotFoundError,
} from "./errors";
import type {
  CreatePreviewSessionInput,
  GenerationOptions,
  JsonObject,
  JsonValue,
  PreviewSession,
  PreviewSessionMatchInput,
  PreviewSessionStore,
} from "./types";

export const DEFAULT_PREVIEW_SESSION_TTL_MS = 10 * 60 * 1000;
export const MAX_PREVIEW_SESSION_TTL_MS = 30 * 60 * 1000;

type MemoryPreviewSessionStoreOptions = {
  readonly ttlMs?: number;
  readonly maxTtlMs?: number;
  readonly now?: () => number;
  readonly createId?: () => string;
};

export function createMemoryPreviewSessionStore(
  options: MemoryPreviewSessionStoreOptions = {},
): PreviewSessionStore {
  const sessions = new Map<string, PreviewSession>();
  const maxTtlMs = getPositiveInteger(
    options.maxTtlMs ?? MAX_PREVIEW_SESSION_TTL_MS,
    "maxTtlMs",
  );
  const defaultTtlMs = Math.min(
    getPositiveInteger(
      options.ttlMs ?? DEFAULT_PREVIEW_SESSION_TTL_MS,
      "ttlMs",
    ),
    maxTtlMs,
  );
  const now = options.now ?? Date.now;
  const createId = options.createId ?? createPreviewSessionId;

  function cleanupExpiredSessions() {
    const currentTime = now();
    let deletedCount = 0;

    for (const [sessionId, session] of sessions) {
      if (isExpired(session, currentTime)) {
        sessions.delete(sessionId);
        deletedCount += 1;
      }
    }

    return deletedCount;
  }

  function getSession(id: string) {
    const session = sessions.get(id);

    if (!session) {
      throw new PreviewSessionNotFoundError(id);
    }

    if (isExpired(session, now())) {
      sessions.delete(id);
      throw new PreviewSessionExpiredError(id);
    }

    return clonePreviewSession(session);
  }

  return {
    createSession(input: CreatePreviewSessionInput) {
      cleanupExpiredSessions();

      const createdAt = now();
      const ttlMs = Math.min(
        getPositiveInteger(input.ttlMs ?? defaultTtlMs, "ttlMs"),
        maxTtlMs,
      );
      const session = buildPreviewSession({
        input,
        createdAt,
        expiresAt: createdAt + ttlMs,
        id: createId(),
      });

      sessions.set(session.id, session);

      return clonePreviewSession(session);
    },
    getSession,
    deleteSession(id: string) {
      return sessions.delete(id);
    },
    validateSessionMatch(input: PreviewSessionMatchInput) {
      const session = getSession(input.id);

      if (session.projectName !== input.projectName) {
        throw new PreviewSessionMismatchError(input.id, "projectName");
      }

      if (session.stackId !== input.stackId) {
        throw new PreviewSessionMismatchError(input.id, "stackId");
      }

      if (
        input.projectBrief !== undefined &&
        session.projectBrief !== input.projectBrief
      ) {
        throw new PreviewSessionMismatchError(input.id, "projectBrief");
      }

      if (
        input.generationOptions !== undefined &&
        !areJsonValuesEqual(session.generationOptions, input.generationOptions)
      ) {
        throw new PreviewSessionMismatchError(input.id, "generationOptions");
      }

      if (
        input.files !== undefined &&
        !areGeneratedFilesEqual(session.files, input.files)
      ) {
        throw new PreviewSessionMismatchError(input.id, "files");
      }

      return session;
    },
    cleanupExpiredSessions,
  };
}

const defaultPreviewSessionStore = createMemoryPreviewSessionStore();

export const previewSessionStore = defaultPreviewSessionStore;

export function createSession(input: CreatePreviewSessionInput) {
  return defaultPreviewSessionStore.createSession(input);
}

export function getSession(id: string) {
  return defaultPreviewSessionStore.getSession(id);
}

export function deleteSession(id: string) {
  return defaultPreviewSessionStore.deleteSession(id);
}

export function validateSessionMatch(input: PreviewSessionMatchInput) {
  return defaultPreviewSessionStore.validateSessionMatch(input);
}

export function cleanupExpiredSessions() {
  return defaultPreviewSessionStore.cleanupExpiredSessions();
}

function buildPreviewSession({
  input,
  createdAt,
  expiresAt,
  id,
}: {
  readonly input: CreatePreviewSessionInput;
  readonly createdAt: number;
  readonly expiresAt: number;
  readonly id: string;
}): PreviewSession {
  const session: {
    id: string;
    projectName: string;
    stackId: string;
    files: GeneratedFile[];
    createdAt: number;
    expiresAt: number;
    projectBrief?: string;
    generationOptions?: GenerationOptions;
  } = {
    id,
    projectName: input.projectName,
    stackId: input.stackId,
    files: cloneGeneratedFiles(input.files),
    createdAt,
    expiresAt,
  };

  if (input.projectBrief !== undefined) {
    session.projectBrief = input.projectBrief;
  }

  if (input.generationOptions !== undefined) {
    session.generationOptions = cloneJsonObject(input.generationOptions);
  }

  return session;
}

function clonePreviewSession(session: PreviewSession): PreviewSession {
  const clone: {
    id: string;
    projectName: string;
    stackId: string;
    files: GeneratedFile[];
    createdAt: number;
    expiresAt: number;
    projectBrief?: string;
    generationOptions?: GenerationOptions;
  } = {
    id: session.id,
    projectName: session.projectName,
    stackId: session.stackId,
    files: cloneGeneratedFiles(session.files),
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
  };

  if (session.projectBrief !== undefined) {
    clone.projectBrief = session.projectBrief;
  }

  if (session.generationOptions !== undefined) {
    clone.generationOptions = cloneJsonObject(session.generationOptions);
  }

  return clone;
}

function cloneGeneratedFiles(files: readonly GeneratedFile[]) {
  return files.map((file) => ({
    path: file.path,
    content: file.content,
  }));
}

function cloneJsonObject(value: GenerationOptions): GenerationOptions {
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, cloneJsonValue(item)]),
  );
}

function cloneJsonValue(value: JsonValue): JsonValue {
  if (Array.isArray(value)) {
    return value.map((item) => cloneJsonValue(item));
  }

  if (isJsonObject(value)) {
    return cloneJsonObject(value);
  }

  return value;
}

function areJsonValuesEqual(
  left: JsonValue | undefined,
  right: JsonValue,
): boolean {
  if (left === undefined) {
    return false;
  }

  if (left === right) {
    return true;
  }

  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right)) {
      return false;
    }

    return (
      left.length === right.length &&
      left.every((leftItem, index): boolean => {
        const rightItem = right[index];

        return (
          rightItem !== undefined && areJsonValuesEqual(leftItem, rightItem)
        );
      })
    );
  }

  if (isJsonObject(left) || isJsonObject(right)) {
    if (!isJsonObject(left) || !isJsonObject(right)) {
      return false;
    }

    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);

    if (leftKeys.length !== rightKeys.length) {
      return false;
    }

    return leftKeys.every((key): boolean => {
      if (!(key in right)) {
        return false;
      }

      return areJsonValuesEqual(left[key], right[key] as JsonValue);
    });
  }

  return false;
}

function isJsonObject(value: JsonValue | undefined): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isExpired(session: PreviewSession, now: number) {
  return session.expiresAt <= now;
}

function getPositiveInteger(value: number, name: string) {
  const integerValue = Math.floor(value);

  if (!Number.isFinite(value) || integerValue <= 0) {
    throw new RangeError(`${name} must be a positive number.`);
  }

  return integerValue;
}

function createPreviewSessionId() {
  return crypto.randomUUID();
}
