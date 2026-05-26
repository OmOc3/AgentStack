export type PreviewSessionMismatchReason =
  | "projectName"
  | "stackId"
  | "projectBrief"
  | "generationOptions"
  | "files";

export class PreviewSessionNotFoundError extends Error {
  readonly sessionId: string;

  constructor(sessionId: string) {
    super(`Preview session "${sessionId}" was not found.`);
    this.name = "PreviewSessionNotFoundError";
    this.sessionId = sessionId;
  }
}

export class PreviewSessionExpiredError extends Error {
  readonly sessionId: string;

  constructor(sessionId: string) {
    super(`Preview session "${sessionId}" has expired.`);
    this.name = "PreviewSessionExpiredError";
    this.sessionId = sessionId;
  }
}

export class PreviewSessionMismatchError extends Error {
  readonly sessionId: string;
  readonly reason: PreviewSessionMismatchReason;

  constructor(sessionId: string, reason: PreviewSessionMismatchReason) {
    super(
      `Preview session "${sessionId}" does not match the current ${reason}.`,
    );
    this.name = "PreviewSessionMismatchError";
    this.sessionId = sessionId;
    this.reason = reason;
  }
}
