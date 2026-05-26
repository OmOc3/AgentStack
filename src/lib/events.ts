"use client";

import { track } from "@vercel/analytics";

export function trackRepoGenerated(stack: string) {
  track("repo_generated", { stack });
}

export function trackPreviewRequested(stack: string) {
  track("preview_requested", { stack });
}

export function trackGithubSignIn() {
  track("github_sign_in");
}

export function trackRepoShared() {
  track("repo_shared");
}

export function trackFileCopied() {
  track("file_copied");
}
