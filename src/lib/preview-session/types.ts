import type { GeneratedFile } from "../generated-files/types";

export type JsonPrimitive = string | number | boolean | null;
export type JsonObject = { readonly [key: string]: JsonValue };
export type JsonArray = readonly JsonValue[];
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

export type GenerationOptions = JsonObject;

export type PreviewSession = {
  readonly id: string;
  readonly projectName: string;
  readonly stackId: string;
  readonly files: readonly GeneratedFile[];
  readonly createdAt: number;
  readonly expiresAt: number;
  readonly projectBrief?: string;
  readonly generationOptions?: GenerationOptions;
};

export type CreatePreviewSessionInput = {
  readonly projectName: string;
  readonly stackId: string;
  readonly files: readonly GeneratedFile[];
  readonly ttlMs?: number;
  readonly projectBrief?: string;
  readonly generationOptions?: GenerationOptions;
};

export type PreviewSessionMatchInput = {
  readonly id: string;
  readonly projectName: string;
  readonly stackId: string;
  readonly files?: readonly GeneratedFile[];
  readonly projectBrief?: string;
  readonly generationOptions?: GenerationOptions;
};

export type PreviewSessionStore = {
  createSession(input: CreatePreviewSessionInput): PreviewSession;
  getSession(id: string): PreviewSession;
  deleteSession(id: string): boolean;
  validateSessionMatch(input: PreviewSessionMatchInput): PreviewSession;
  cleanupExpiredSessions(): number;
};
