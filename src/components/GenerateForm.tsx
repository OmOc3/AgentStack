"use client";

import { AlertCircle, Github } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

import { GenerateButton } from "@/components/GenerateButton";
import { StackCard } from "@/components/StackCard";
import { StepIndicator } from "@/components/StepIndicator";
import type { StackDefinition, StackId } from "@/lib/stacks";
import { validateProjectName } from "@/lib/validation";

type GenerateResponse = {
  repoUrl?: unknown;
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
  userName?: string | null;
}) {
  const router = useRouter();
  const [projectName, setProjectName] = useState("");
  const [selectedStack, setSelectedStack] = useState<StackId | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isLimited, setIsLimited] = useState(hasGenerated);

  const projectNameError = useMemo(() => {
    if (!projectName) {
      return null;
    }

    return validateProjectName(projectName);
  }, [projectName]);

  const isProjectValid = Boolean(projectName) && !projectNameError;
  const currentStep = !isProjectValid
    ? 1
    : selectedStack
      ? isSignedIn
        ? 4
        : 3
      : 2;
  const canGenerate =
    isProjectValid && selectedStack && isSignedIn && !isLoading && !isLimited;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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

    if (isLimited) {
      setError("This browser session has already created a repo.");
      return;
    }

    if (!isSignedIn) {
      await signIn("github", { callbackUrl: "/generate" });
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
          stack: selectedStack,
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

      router.push(`/success?repo=${encodeURIComponent(data.repoUrl)}`);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Repo generation failed.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative">
      {error ? (
        <div
          className="fixed right-4 top-4 z-50 flex max-w-sm items-start gap-3 rounded-lg border border-red-500/30 bg-red-950/90 p-4 text-sm text-red-100 shadow-2xl shadow-red-950/30"
          role="status"
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4" />
          <span>{error}</span>
        </div>
      ) : null}

      <form className="space-y-8" onSubmit={handleSubmit}>
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
          <p className="mt-1 text-sm text-zinc-400">
            Use letters, numbers, and hyphens. This becomes the GitHub repo
            name.
          </p>
          <input
            autoComplete="off"
            className="mt-4 h-12 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
            id="projectName"
            maxLength={100}
            onChange={(event) => setProjectName(event.target.value)}
            placeholder="my-agent-app"
            type="text"
            value={projectName}
          />
          {projectNameError ? (
            <p className="mt-2 text-sm text-red-300">{projectNameError}</p>
          ) : null}
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">
              Choose a stack
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              AgentStack adds the app files and the agent instructions for the
              stack you pick.
            </p>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {stacks.map((stack) => (
              <StackCard
                isSelected={selectedStack === stack.id}
                key={stack.id}
                onSelect={setSelectedStack}
                stack={stack}
              />
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-lg border border-zinc-800 bg-zinc-900/60 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">GitHub</h2>
            <p className="mt-1 text-sm text-zinc-400">
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
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-zinc-950"
              onClick={() => signIn("github", { callbackUrl: "/generate" })}
              type="button"
            >
              <Github aria-hidden="true" className="h-4 w-4" />
              Login with GitHub
            </button>
          )}
        </section>

        <div className="flex justify-end">
          <GenerateButton disabled={!canGenerate} isLoading={isLoading} />
        </div>
      </form>
    </div>
  );
}
