"use client";

import { AlertCircle, Download, Github, Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  type ChangeEventHandler,
  type FormEventHandler,
  type MouseEventHandler,
  useMemo,
  useState,
} from "react";

import { FilePreview, type PreviewFile } from "@/components/FilePreview";
import { GenerateButton } from "@/components/GenerateButton";
import { GenerationProgress } from "@/components/GenerationProgress";
import { StackCard } from "@/components/StackCard";
import { StepIndicator } from "@/components/StepIndicator";
import {
  StackCategoryFilter,
  StackSearchInput,
} from "@/components/stack-discovery";
import {
  trackGithubSignIn,
  trackPreviewRequested,
  trackRepoGenerated,
} from "@/lib/events";
import {
  DEFAULT_REPOSITORY_DESCRIPTION,
  DEFAULT_REPOSITORY_VISIBILITY,
  PROJECT_BRIEF_MAX_LENGTH,
  REPOSITORY_DESCRIPTION_MAX_LENGTH,
  validateProjectBrief,
  validateRepositoryDescription,
  validateRepositoryVisibility,
  type RepositoryVisibility,
} from "@/lib/generation-options";
import {
  filterStacksByCategory,
  searchStacks,
  stackCategories,
  type StackCategory,
  type StackCategoryFilterValue,
} from "@/lib/stack-discovery";
import { toStackDiscoveryItems } from "@/lib/stack-discovery/metadata";
import type { StackDefinition, StackId } from "@/lib/stacks";
import { validateProjectName } from "@/lib/validation";

type GenerateResponse = {
  previewId?: unknown;
  previewSessionId?: unknown;
  repoUrl?: unknown;
  error?: unknown;
};

type PreviewResponse = {
  files?: unknown;
  previewId?: unknown;
  previewSessionId?: unknown;
  error?: unknown;
};

export function GenerateForm({
  hasGenerated,
  isSignedIn,
  stacks,
  userName,
}: {
  hasGenerated: boolean;
  isSignedIn: boolean;
  stacks: StackDefinition[];
  userName?: string | null | undefined;
}) {
  const router = useRouter();
  const [projectName, setProjectName] = useState<string>("");
  const [selectedStack, setSelectedStack] = useState<StackId | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);
  const [previewFiles, setPreviewFiles] = useState<PreviewFile[] | null>(null);
  const [previewSessionId, setPreviewSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [isLimited, setIsLimited] = useState<boolean>(hasGenerated);
  const [repositoryVisibility, setRepositoryVisibility] =
    useState<RepositoryVisibility>(DEFAULT_REPOSITORY_VISIBILITY);
  const [repositoryDescription, setRepositoryDescription] = useState<string>(
    DEFAULT_REPOSITORY_DESCRIPTION,
  );
  const [projectBrief, setProjectBrief] = useState<string>("");
  const [stackQuery, setStackQuery] = useState("");
  const [stackCategory, setStackCategory] =
    useState<StackCategoryFilterValue>("all");

  const projectNameError = useMemo(() => {
    if (!projectName) {
      return null;
    }

    return validateProjectName(projectName);
  }, [projectName]);

  const discoveryStacks = useMemo(() => toStackDiscoveryItems(stacks), [stacks]);
  const categoryCounts = useMemo(() => {
    return discoveryStacks.reduce<Partial<Record<StackCategory, number>>>(
      (counts, stack) => {
        const category = stack.metadata.category;
        counts[category] = (counts[category] ?? 0) + 1;

        return counts;
      },
      {},
    );
  }, [discoveryStacks]);
  const availableCategories = useMemo(
    () => stackCategories.filter((category) => categoryCounts[category]),
    [categoryCounts],
  );
  const visibleStacks = useMemo(() => {
    const stacksByCategory = filterStacksByCategory(
      discoveryStacks,
      stackCategory,
    );

    return searchStacks(stacksByCategory, stackQuery);
  }, [discoveryStacks, stackCategory, stackQuery]);

  const isProjectValid = Boolean(projectName) && !projectNameError;
  const hasPreview = previewFiles !== null && previewSessionId !== null;
  const currentStep = !isProjectValid
    ? 1
    : !selectedStack
      ? 2
      : !hasPreview
        ? 3
        : isSignedIn
          ? 5
          : 4;
  const canPreview = Boolean(
    isProjectValid &&
      selectedStack &&
      !isPreviewLoading &&
      !isLoading &&
      !isLimited,
  );
  const canGenerate =
    isProjectValid &&
    selectedStack &&
    hasPreview &&
    isSignedIn &&
    !isLoading &&
    !isPreviewLoading &&
    !isLimited;
  const generateDisabledReason = !isProjectValid
    ? "Enter a valid project name before generating the repo."
    : !selectedStack
      ? "Choose a stack before generating the repo."
      : !hasPreview
        ? "Preview the generated files before creating the repo."
        : !isSignedIn
          ? "Sign in with GitHub before generating the repo."
          : isLimited
            ? "This browser session has already created a repo."
            : isLoading || isPreviewLoading
              ? "Wait for the current request to finish."
              : "Generate repo";

  function clearPreview() {
    setPreviewFiles(null);
    setPreviewSessionId(null);
  }

  function getGenerationOptionsPayload() {
    return {
      visibility: repositoryVisibility,
      description: repositoryDescription,
      projectBrief,
    };
  }

  function validateGenerationOptionsFields() {
    const visibilityError = validateRepositoryVisibility(repositoryVisibility);
    const descriptionError =
      validateRepositoryDescription(repositoryDescription);
    const briefError = validateProjectBrief(projectBrief);

    return visibilityError ?? descriptionError ?? briefError;
  }

  const handleProjectNameChange: ChangeEventHandler<HTMLInputElement> = (
    event,
  ) => {
    setProjectName(event.target.value);
    clearPreview();
  };

  function handleStackSelect(stackId: StackId) {
    setSelectedStack(stackId);

    if (selectedStack !== stackId) {
      clearPreview();
    }
  }

  async function signInWithGithub() {
    trackGithubSignIn();
    await signIn("github", { callbackUrl: "/generate" });
  }

  const handleGithubSignIn: MouseEventHandler<HTMLButtonElement> = () => {
    void signInWithGithub();
  };

  const handlePreview: MouseEventHandler<HTMLButtonElement> = async () => {
    setError("");

    const validationError = validateProjectName(projectName);

    if (validationError) {
      setError(validationError);
      return;
    }

    if (!selectedStack) {
      setError("Choose a stack before previewing the files.");
      return;
    }

    const generationOptionsError = validateGenerationOptionsFields();

    if (generationOptionsError) {
      setError(generationOptionsError);
      return;
    }

    const stack = selectedStack;

    setIsPreviewLoading(true);
    clearPreview();

    try {
      const response = await fetch("/api/preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectName,
          stack,
          generationOptions: getGenerationOptionsPayload(),
        }),
      });
      const data = (await response.json().catch(() => ({}))) as PreviewResponse;

      if (!response.ok) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : "Preview generation failed.",
        );
      }

      if (!isPreviewFileList(data.files)) {
        throw new Error("The API did not return preview files.");
      }

      const nextPreviewSessionId = getPreviewSessionId(data);

      if (!nextPreviewSessionId) {
        throw new Error("The API did not return a preview session.");
      }

      setPreviewFiles(data.files);
      setPreviewSessionId(nextPreviewSessionId);
      trackPreviewRequested(stack);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Preview generation failed.",
      );
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    setError("");

    const validationError = validateProjectName(projectName);

    if (validationError) {
      setError(validationError);
      return;
    }

    if (!selectedStack) {
      setError("Choose a stack before generating the repo.");
      return;
    }

    const generationOptionsError = validateGenerationOptionsFields();

    if (generationOptionsError) {
      setError(generationOptionsError);
      return;
    }

    const stack = selectedStack;

    if (!previewFiles || !previewSessionId) {
      setError("Preview the generated files before creating the repo.");
      return;
    }

    if (isLimited) {
      setError("This browser session has already created a repo.");
      return;
    }

    if (!isSignedIn) {
      await signInWithGithub();
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectName,
          stack,
          previewSessionId,
          generationOptions: getGenerationOptionsPayload(),
        }),
      });
      const data = (await response.json().catch(() => ({}))) as GenerateResponse;

      if (!response.ok) {
        if (response.status === 429) {
          setIsLimited(true);
        }

        throw new Error(
          typeof data.error === "string"
            ? data.error
            : "Repo generation failed.",
        );
      }

      if (typeof data.repoUrl !== "string") {
        throw new Error("The API did not return a repo URL.");
      }

      trackRepoGenerated(stack);

      const successParams = new URLSearchParams({
        repo: data.repoUrl,
        stack,
      });

      if (typeof data.previewId === "string") {
        successParams.set("pid", data.previewId);
      } else if (typeof data.previewSessionId === "string") {
        successParams.set("pid", data.previewSessionId);
      } else {
        successParams.set("pid", previewSessionId);
      }

      router.push(`/success?${successParams.toString()}`);
    } catch (caughtError) {
      setIsLoading(false);
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Repo generation failed.",
      );
    }
  };

  return (
    <div className="relative">
      {error ? (
        <div
          aria-live="assertive"
          className="fixed right-4 top-4 z-50 flex max-w-sm items-start gap-3 rounded-lg border border-red-500/30 bg-red-950/90 p-4 text-sm text-red-100 shadow-2xl shadow-red-950/30"
          role="alert"
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4" />
          <span>{error}</span>
        </div>
      ) : null}

      {isLoading ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-zinc-950/80 p-4 backdrop-blur-sm">
          <GenerationProgress />
        </div>
      ) : null}

      <form
        aria-busy={isLoading}
        aria-label="Repository generator"
        className={`space-y-8 ${isLoading ? "pointer-events-none" : ""}`}
        onSubmit={handleSubmit}
      >
        <StepIndicator currentStep={currentStep} />

        {isLimited ? (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm leading-6 text-amber-100">
            One repo has already been created in this browser session. Start a
            new session to generate another repo.
          </div>
        ) : null}

        <section className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-5 sm:p-6">
          <label
            className="text-sm font-medium text-zinc-100"
            htmlFor="projectName"
          >
            Project name
          </label>
          <p className="mt-1 text-sm text-zinc-300" id="projectName-help">
            Use letters, numbers, and hyphens. This becomes the GitHub repo
            name.
          </p>
          <input
            aria-describedby={
              projectNameError
                ? "projectName-help projectName-error"
                : "projectName-help"
            }
            aria-invalid={projectNameError ? "true" : undefined}
            autoComplete="off"
            className="mt-4 h-12 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 text-zinc-100 outline-none transition placeholder:text-zinc-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 focus-visible:ring-2 focus-visible:ring-purple-400"
            id="projectName"
            maxLength={100}
            onChange={handleProjectNameChange}
            placeholder="my-agent-app"
            type="text"
            value={projectName}
          />
          {projectNameError ? (
            <p className="mt-2 text-sm text-red-300" id="projectName-error">
              {projectNameError}
            </p>
          ) : null}
        </section>

        <section className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900/60 p-5 sm:p-6">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">
              Repository details
            </h2>
            <p className="mt-1 text-sm text-zinc-300">
              AgentStack uses these when it creates the GitHub repo.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-[minmax(0,0.65fr)_minmax(0,1fr)]">
            <div>
              <label
                className="text-sm font-medium text-zinc-100"
                htmlFor="repositoryVisibility"
              >
                Visibility
              </label>
              <select
                className="mt-2 h-12 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 text-zinc-100 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                id="repositoryVisibility"
                onChange={(event) => {
                  setRepositoryVisibility(
                    event.target.value as RepositoryVisibility,
                  );
                  clearPreview();
                }}
                value={repositoryVisibility}
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>

            <div>
              <label
                className="text-sm font-medium text-zinc-100"
                htmlFor="repositoryDescription"
              >
                Description
              </label>
              <input
                className="mt-2 h-12 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 text-zinc-100 outline-none transition placeholder:text-zinc-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                id="repositoryDescription"
                maxLength={REPOSITORY_DESCRIPTION_MAX_LENGTH}
                onChange={(event) => {
                  setRepositoryDescription(event.target.value);
                  clearPreview();
                }}
                placeholder={DEFAULT_REPOSITORY_DESCRIPTION}
                type="text"
                value={repositoryDescription}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-3">
              <label
                className="text-sm font-medium text-zinc-100"
                htmlFor="projectBrief"
              >
                Project brief
              </label>
              <span className="shrink-0 font-mono text-xs text-zinc-400">
                {projectBrief.length}/{PROJECT_BRIEF_MAX_LENGTH}
              </span>
            </div>
            <textarea
              className="mt-2 min-h-28 w-full resize-y rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none transition placeholder:text-zinc-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
              id="projectBrief"
              maxLength={PROJECT_BRIEF_MAX_LENGTH}
              onChange={(event) => {
                setProjectBrief(event.target.value);
                clearPreview();
              }}
              placeholder="A short note about what this app should do."
              value={projectBrief}
            />
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">
              Choose a stack
            </h2>
            <p className="mt-1 text-sm text-zinc-300">
              AgentStack adds the app files and the agent instructions for the
              stack you pick.
            </p>
          </div>
          <div className="grid gap-4 rounded-lg border border-zinc-800 bg-zinc-900/60 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto]">
            <StackSearchInput
              onQueryChange={setStackQuery}
              resultCount={visibleStacks.length}
              value={stackQuery}
            />
            <StackCategoryFilter
              allCount={discoveryStacks.length}
              categories={availableCategories}
              className="lg:max-w-md"
              counts={categoryCounts}
              onCategoryChange={setStackCategory}
              selectedCategory={stackCategory}
            />
          </div>
          <div
            aria-label="Choose a stack"
            className="grid gap-3 lg:grid-cols-2"
            role="radiogroup"
          >
            {visibleStacks.map((stack) => (
              <StackCard
                isSelected={selectedStack === stack.id}
                key={stack.id}
                onSelect={handleStackSelect}
                stack={stack}
              />
            ))}
          </div>
          {visibleStacks.length === 0 ? (
            <p className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 text-sm text-zinc-300">
              No stacks match those filters.
            </p>
          ) : null}
        </section>

        {selectedStack ? (
          <section className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900/60 p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-zinc-100">
                  Preview
                </h2>
                <p className="mt-1 text-sm text-zinc-300">
                  Review the files before AgentStack creates the repo.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                {previewFiles && previewSessionId ? (
                  <a
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-zinc-950"
                    href={getDownloadHref(previewSessionId, projectName)}
                  >
                    <Download aria-hidden="true" className="h-4 w-4" />
                    Download ZIP
                  </a>
                ) : null}
                <button
                  aria-disabled={!canPreview ? "true" : undefined}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-purple-500/70 px-4 py-2 text-sm font-medium text-purple-100 transition hover:bg-purple-500/10 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:cursor-not-allowed disabled:border-zinc-700 disabled:text-zinc-500"
                  disabled={!canPreview}
                  onClick={handlePreview}
                  type="button"
                >
                  {isPreviewLoading ? (
                    <>
                      <Loader2
                        aria-hidden="true"
                        className="h-4 w-4 animate-spin"
                      />
                      Generating preview...
                    </>
                  ) : (
                    "Preview generated files"
                  )}
                </button>
              </div>
            </div>
            {previewFiles ? <FilePreview files={previewFiles} /> : null}
          </section>
        ) : null}

        {previewFiles ? (
          <section className="flex flex-col gap-4 rounded-lg border border-zinc-800 bg-zinc-900/60 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">GitHub</h2>
              <p className="mt-1 text-sm text-zinc-300">
                {isSignedIn
                  ? `Signed in${userName ? ` as ${userName}` : ""}.`
                  : "Sign in so AgentStack can create the repo on your account."}
              </p>
            </div>
            {isSignedIn ? (
              <span className="inline-flex h-10 items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 text-sm font-medium text-emerald-200">
                Connected
              </span>
            ) : (
              <button
                aria-label="Sign in with GitHub to continue"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-zinc-950"
                onClick={handleGithubSignIn}
                type="button"
              >
                <Github aria-hidden="true" className="h-4 w-4" />
                Login with GitHub
              </button>
            )}
          </section>
        ) : null}

        {previewFiles ? (
          <div className="flex justify-end">
            <GenerateButton
              disabled={!canGenerate}
              disabledReason={generateDisabledReason}
              isLoading={isLoading}
            />
          </div>
        ) : null}
      </form>
    </div>
  );
}

function isPreviewFileList(value: unknown): value is PreviewFile[] {
  return (
    Array.isArray(value) &&
    value.every(
      (file) =>
        typeof file === "object" &&
        file !== null &&
        "path" in file &&
        "content" in file &&
        typeof file.path === "string" &&
        typeof file.content === "string",
    )
  );
}

function getPreviewSessionId(data: PreviewResponse) {
  if (typeof data.previewSessionId === "string") {
    return data.previewSessionId;
  }

  if (typeof data.previewId === "string") {
    return data.previewId;
  }

  return null;
}

function getDownloadHref(previewSessionId: string, projectName: string) {
  return `/api/download?${new URLSearchParams({
    previewId: previewSessionId,
    projectName,
  }).toString()}`;
}
