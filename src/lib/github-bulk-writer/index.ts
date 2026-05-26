import { Octokit } from "@octokit/rest";

import {
  GeneratedFileValidationError,
  normalizeGeneratedPath,
} from "../generated-files";

export type GitHubBulkWriterFile = {
  path: string;
  content: string;
};

export type CreateRepositoryWithInitialCommitInput = {
  githubToken: string;
  owner?: string;
  repoName: string;
  description: string;
  private: boolean;
  files: GitHubBulkWriterFile[];
  defaultBranch?: string;
};

export type CreateRepositoryWithInitialCommitResult = {
  owner: string;
  repoName: string;
  repositoryUrl: string;
  defaultBranch: string;
  commitSha: string;
  treeSha: string;
  fileCount: number;
};

export type GitHubBulkWriterErrorCode =
  | "github_unauthorized"
  | "github_repo_already_exists"
  | "github_rate_limit"
  | "github_validation"
  | "github_unknown";

type GitHubBulkWriterErrorOptions = {
  status?: number;
  cause?: unknown;
};

export class GitHubBulkWriterError extends Error {
  readonly code: GitHubBulkWriterErrorCode;
  readonly status?: number;

  constructor(
    message: string,
    code: GitHubBulkWriterErrorCode,
    options: GitHubBulkWriterErrorOptions = {},
  ) {
    super(message);
    this.name = new.target.name;
    this.code = code;

    if (options.status !== undefined) {
      this.status = options.status;
    }

    if ("cause" in options) {
      this.cause = options.cause;
    }

    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class GitHubUnauthorizedError extends GitHubBulkWriterError {
  constructor(options: GitHubBulkWriterErrorOptions = {}) {
    super(
      "GitHub rejected the token or repository permissions.",
      "github_unauthorized",
      options,
    );
  }
}

export class GitHubRepoAlreadyExistsError extends GitHubBulkWriterError {
  constructor(options: GitHubBulkWriterErrorOptions = {}) {
    super(
      "A GitHub repository with that owner and name already exists.",
      "github_repo_already_exists",
      options,
    );
  }
}

export class GitHubRateLimitError extends GitHubBulkWriterError {
  constructor(options: GitHubBulkWriterErrorOptions = {}) {
    super(
      "GitHub rate limit reached. Try again later.",
      "github_rate_limit",
      options,
    );
  }
}

export class GitHubValidationError extends GitHubBulkWriterError {
  constructor(
    message = "GitHub rejected the repository request.",
    options: GitHubBulkWriterErrorOptions = {},
  ) {
    super(message, "github_validation", options);
  }
}

export class GitHubUnknownError extends GitHubBulkWriterError {
  constructor(options: GitHubBulkWriterErrorOptions = {}) {
    super(
      "GitHub could not create the repository.",
      "github_unknown",
      options,
    );
  }
}

type OctokitClient = InstanceType<typeof Octokit>;

type NormalizedInput = {
  githubToken: string;
  owner: string | undefined;
  repoName: string;
  description: string;
  private: boolean;
  files: GitHubBulkWriterFile[];
  defaultBranch: string;
};

const DEFAULT_BRANCH = "main";
const MAX_REPO_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 350;
const OWNER_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,98}[A-Za-z0-9])?$/;
const REPO_NAME_PATTERN = /^[A-Za-z0-9._-]+$/;
const INVALID_BRANCH_CHARACTER_PATTERN = /[\s~^:?*[\\\x00-\x1f\x7f]/;

export async function createRepositoryWithInitialCommit(
  input: CreateRepositoryWithInitialCommitInput,
): Promise<CreateRepositoryWithInitialCommitResult> {
  try {
    const normalizedInput = normalizeInput(input);
    const octokit = new Octokit({ auth: normalizedInput.githubToken });
    const repository = await createRepository(octokit, normalizedInput);
    const owner = repository.owner;
    const repoName = repository.name;

    const blobs: GitHubBulkWriterFileBlob[] = [];

    for (const file of normalizedInput.files) {
      const blob = await octokit.git.createBlob({
        owner,
        repo: repoName,
        content: file.content,
        encoding: "utf-8",
      });

      blobs.push({
        path: file.path,
        sha: blob.data.sha,
      });
    }

    const tree = await octokit.git.createTree({
      owner,
      repo: repoName,
      tree: blobs.map((blob) => ({
        path: blob.path,
        mode: "100644",
        type: "blob",
        sha: blob.sha,
      })),
    });

    const commit = await octokit.git.createCommit({
      owner,
      repo: repoName,
      message: "Initial commit",
      tree: tree.data.sha,
      parents: [],
    });

    await createOrUpdateBranchRef(octokit, {
      owner,
      repoName,
      branch: normalizedInput.defaultBranch,
      commitSha: commit.data.sha,
    });

    if (repository.defaultBranch !== normalizedInput.defaultBranch) {
      await octokit.repos.update({
        owner,
        repo: repoName,
        default_branch: normalizedInput.defaultBranch,
      });
    }

    return {
      owner,
      repoName,
      repositoryUrl: repository.htmlUrl,
      defaultBranch: normalizedInput.defaultBranch,
      commitSha: commit.data.sha,
      treeSha: tree.data.sha,
      fileCount: normalizedInput.files.length,
    };
  } catch (error) {
    throw toGitHubBulkWriterError(error);
  }
}

type GitHubBulkWriterFileBlob = {
  path: string;
  sha: string;
};

type CreatedRepository = {
  owner: string;
  name: string;
  htmlUrl: string;
  defaultBranch: string;
};

async function createRepository(
  octokit: OctokitClient,
  input: NormalizedInput,
): Promise<CreatedRepository> {
  const repository = input.owner
    ? await createRepositoryForOwner(octokit, input)
    : await octokit.repos.createForAuthenticatedUser({
        name: input.repoName,
        description: input.description,
        private: input.private,
        auto_init: false,
      });

  return {
    owner: repository.data.owner.login,
    name: repository.data.name,
    htmlUrl: repository.data.html_url,
    defaultBranch: repository.data.default_branch,
  };
}

async function createRepositoryForOwner(
  octokit: OctokitClient,
  input: NormalizedInput,
) {
  const authenticatedUser = await octokit.users.getAuthenticated();
  const owner = input.owner;

  if (!owner) {
    throw new GitHubValidationError("Repository owner is missing.");
  }

  if (authenticatedUser.data.login.toLowerCase() === owner.toLowerCase()) {
    return octokit.repos.createForAuthenticatedUser({
      name: input.repoName,
      description: input.description,
      private: input.private,
      auto_init: false,
    });
  }

  return octokit.repos.createInOrg({
    org: owner,
    name: input.repoName,
    description: input.description,
    private: input.private,
    auto_init: false,
  });
}

async function createOrUpdateBranchRef(
  octokit: OctokitClient,
  input: {
    owner: string;
    repoName: string;
    branch: string;
    commitSha: string;
  },
) {
  try {
    await octokit.git.createRef({
      owner: input.owner,
      repo: input.repoName,
      ref: `refs/heads/${input.branch}`,
      sha: input.commitSha,
    });
  } catch (error) {
    if (!isReferenceAlreadyExistsError(error)) {
      throw error;
    }

    await octokit.git.updateRef({
      owner: input.owner,
      repo: input.repoName,
      ref: `heads/${input.branch}`,
      sha: input.commitSha,
      force: false,
    });
  }
}

function normalizeInput(
  input: CreateRepositoryWithInitialCommitInput,
): NormalizedInput {
  assertNonEmptyString(input.githubToken, "GitHub token is required.");

  const owner = normalizeOptionalOwner(input.owner);
  const repoName = normalizeRepoName(input.repoName);
  const defaultBranch = normalizeBranchName(input.defaultBranch ?? DEFAULT_BRANCH);
  const description = normalizeDescription(input.description);
  const files = normalizeFiles(input.files);

  if (typeof input.private !== "boolean") {
    throw new GitHubValidationError("Repository visibility must be set.");
  }

  return {
    githubToken: input.githubToken.trim(),
    owner,
    repoName,
    description,
    private: input.private,
    files,
    defaultBranch,
  };
}

function normalizeOptionalOwner(owner: string | undefined): string | undefined {
  if (owner === undefined || owner.trim() === "") {
    return undefined;
  }

  const normalizedOwner = owner.trim();

  if (!OWNER_PATTERN.test(normalizedOwner)) {
    throw new GitHubValidationError("Repository owner is not a valid GitHub login.");
  }

  return normalizedOwner;
}

function normalizeRepoName(repoName: string): string {
  assertNonEmptyString(repoName, "Repository name is required.");

  const normalizedRepoName = repoName.trim();

  if (
    normalizedRepoName.length > MAX_REPO_NAME_LENGTH ||
    normalizedRepoName === "." ||
    normalizedRepoName === ".." ||
    !REPO_NAME_PATTERN.test(normalizedRepoName)
  ) {
    throw new GitHubValidationError(
      "Repository name can only include letters, numbers, dots, dashes, and underscores.",
    );
  }

  return normalizedRepoName;
}

function normalizeDescription(description: string): string {
  if (typeof description !== "string") {
    throw new GitHubValidationError("Repository description must be text.");
  }

  const normalizedDescription = description.trim();

  if (normalizedDescription.length > MAX_DESCRIPTION_LENGTH) {
    throw new GitHubValidationError("Repository description is too long.");
  }

  return normalizedDescription;
}

function normalizeBranchName(branch: string): string {
  assertNonEmptyString(branch, "Default branch is required.");

  const normalizedBranch = branch.trim();

  if (
    normalizedBranch === "." ||
    normalizedBranch === ".." ||
    normalizedBranch.startsWith("/") ||
    normalizedBranch.endsWith("/") ||
    normalizedBranch.endsWith(".") ||
    normalizedBranch.includes("..") ||
    normalizedBranch.includes("//") ||
    normalizedBranch.includes("@{") ||
    normalizedBranch.startsWith("refs/") ||
    INVALID_BRANCH_CHARACTER_PATTERN.test(normalizedBranch)
  ) {
    throw new GitHubValidationError("Default branch is not a valid Git branch name.");
  }

  return normalizedBranch;
}

function normalizeFiles(files: GitHubBulkWriterFile[]): GitHubBulkWriterFile[] {
  if (!Array.isArray(files) || files.length === 0) {
    throw new GitHubValidationError("At least one generated file is required.");
  }

  const seenPaths = new Set<string>();

  return files.map((file) => {
    if (!file || typeof file.content !== "string") {
      throw new GitHubValidationError("Each generated file needs text content.");
    }

    const path = validateGitHubBulkWriterPath(file.path);

    if (seenPaths.has(path)) {
      throw new GitHubValidationError("Generated files include the same path more than once.");
    }

    seenPaths.add(path);

    return {
      path,
      content: file.content,
    };
  });
}

export function validateGitHubBulkWriterPath(path: string): string {
  try {
    return normalizeGeneratedPath(path);
  } catch (error) {
    if (error instanceof GeneratedFileValidationError) {
      throw new GitHubValidationError(
        "Generated file path is not safe to write.",
        { cause: error },
      );
    }

    throw error;
  }
}

function assertNonEmptyString(value: string, message: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new GitHubValidationError(message);
  }
}

export function toGitHubBulkWriterError(error: unknown): GitHubBulkWriterError {
  if (error instanceof GitHubBulkWriterError) {
    return error;
  }

  const status = getHttpStatus(error);

  if (isRateLimitError(error, status)) {
    return new GitHubRateLimitError(createErrorOptions(status, error));
  }

  if (isRepoAlreadyExistsError(error, status)) {
    return new GitHubRepoAlreadyExistsError(createErrorOptions(status, error));
  }

  if (status === 401 || status === 403) {
    return new GitHubUnauthorizedError({ status, cause: error });
  }

  if (status === 400 || status === 404 || status === 409 || status === 422) {
    return new GitHubValidationError(undefined, { status, cause: error });
  }

  return new GitHubUnknownError(createErrorOptions(status, error));
}

function createErrorOptions(
  status: number | undefined,
  cause: unknown,
): GitHubBulkWriterErrorOptions {
  const options: GitHubBulkWriterErrorOptions = { cause };

  if (status !== undefined) {
    options.status = status;
  }

  return options;
}

function getHttpStatus(error: unknown): number | undefined {
  if (typeof error === "object" && error && "status" in error) {
    const status = (error as { status?: unknown }).status;
    return typeof status === "number" ? status : undefined;
  }

  return undefined;
}

function isRateLimitError(error: unknown, status: number | undefined): boolean {
  const message = getErrorSearchText(error);
  const remaining = getHeader(error, "x-ratelimit-remaining");

  return (
    status === 429 ||
    (status === 403 && remaining === "0") ||
    message.includes("rate limit") ||
    message.includes("secondary rate limit")
  );
}

function isRepoAlreadyExistsError(
  error: unknown,
  status: number | undefined,
): boolean {
  if (status !== 422) {
    return false;
  }

  const message = getErrorSearchText(error);

  return (
    message.includes("name already exists") ||
    message.includes("already exists on this account") ||
    (message.includes("already_exists") && message.includes("name"))
  );
}

function isReferenceAlreadyExistsError(error: unknown): boolean {
  if (getHttpStatus(error) !== 422) {
    return false;
  }

  const message = getErrorSearchText(error);
  return message.includes("reference already exists");
}

function getHeader(error: unknown, headerName: string): string | undefined {
  const headers = getHeaders(error);

  if (!headers) {
    return undefined;
  }

  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() !== headerName.toLowerCase()) {
      continue;
    }

    if (Array.isArray(value)) {
      return value[0]?.toString();
    }

    return value?.toString();
  }

  return undefined;
}

function getHeaders(error: unknown): Record<string, unknown> | undefined {
  if (typeof error !== "object" || !error) {
    return undefined;
  }

  if ("response" in error) {
    const response = (error as { response?: { headers?: unknown } }).response;

    if (response?.headers && typeof response.headers === "object") {
      return response.headers as Record<string, unknown>;
    }
  }

  if ("headers" in error) {
    const headers = (error as { headers?: unknown }).headers;

    if (headers && typeof headers === "object") {
      return headers as Record<string, unknown>;
    }
  }

  return undefined;
}

function getErrorSearchText(error: unknown): string {
  if (typeof error !== "object" || !error) {
    return "";
  }

  const parts: string[] = [];

  if ("message" in error && typeof error.message === "string") {
    parts.push(error.message);
  }

  if ("response" in error) {
    const response = (error as { response?: { data?: unknown } }).response;

    if (response?.data && typeof response.data === "object") {
      parts.push(...extractTextValues(response.data));
    }
  }

  return parts.join(" ").toLowerCase();
}

function extractTextValues(value: unknown): string[] {
  if (typeof value === "string") {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.flatMap(extractTextValues);
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  return Object.values(value).flatMap(extractTextValues);
}
