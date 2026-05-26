export type GeneratedFile = {
  readonly path: string;
  readonly content: string;
};

export type GeneratedFileCategory = "agent" | "config" | "app" | "docs" | "env";

export type GeneratedFileMetadata = {
  readonly path: string;
  readonly category: GeneratedFileCategory;
  readonly characterCount: number;
};

export type GeneratedFileStats = {
  readonly totalFiles: number;
  readonly totalCharacters: number;
};
