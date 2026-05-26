import {
  ArrowRight,
  CheckCircle2,
  FileText,
  GitBranch,
  Github,
} from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";

import { StackIcon } from "@/components/StackIcon";
import { stackDefinitions } from "@/lib/stacks";

const steps = [
  "Name the repo",
  "Choose a starter stack",
  "Sign in with GitHub",
] as const;

const agentFiles = [
  {
    name: "CLAUDE.md",
    description: "Full project context for Claude",
  },
  {
    name: "AGENT.md",
    description: "Working rules and danger zones",
  },
  {
    name: ".cursorrules",
    description: "Cursor IDE coding style",
  },
  {
    name: ".windsurfrules",
    description: "Windsurf cascade rules",
  },
] as const;

type StatsResponse = {
  count?: unknown;
};

async function getRepoCount() {
  const headerStore = await headers();
  const host = headerStore.get("host");

  if (!host) {
    return 0;
  }

  const protocol = headerStore.get("x-forwarded-proto") ?? "http";

  try {
    const response = await fetch(`${protocol}://${host}/api/stats`, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return 0;
    }

    const stats = (await response.json()) as StatsResponse;

    return typeof stats.count === "number" && Number.isFinite(stats.count)
      ? stats.count
      : 0;
  } catch {
    return 0;
  }
}

export default async function Page() {
  const repoCount = await getRepoCount();

  return (
    <main
      aria-label="AgentStack homepage"
      className="min-h-screen bg-zinc-950 px-5 py-6 text-zinc-100 sm:px-6 lg:py-10"
    >
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col">
        <header className="flex items-center justify-between gap-4">
          <Link
            className="rounded text-base font-semibold tracking-tight focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-zinc-950"
            href="/"
          >
            AgentStack
          </Link>
          <Link
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-zinc-800 px-3 py-2 text-sm font-medium text-zinc-100 transition hover:border-zinc-600 hover:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-zinc-950"
            href="/generate"
          >
            Generate repo
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </header>

        <section className="grid flex-1 items-center gap-10 py-14 lg:grid-cols-[1fr_26rem] lg:py-20">
          <div className="max-w-3xl">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-sm font-medium text-purple-200">
              <GitBranch aria-hidden="true" className="h-4 w-4" />
              Public GitHub repos, generated from starters
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-50 sm:text-5xl lg:text-6xl">
              Start a repo that already knows how agents should work.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-300 sm:text-lg">
              Pick a stack, connect GitHub, and AgentStack creates the repo with
              app files, setup notes, and agent instructions in place.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-zinc-950 sm:w-auto"
                href="/generate"
              >
                Generate a repo
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
              <a
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-zinc-800 px-5 py-3 text-sm font-medium text-zinc-100 transition hover:border-zinc-600 hover:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-zinc-950 sm:w-auto"
                href="https://github.com"
                rel="noreferrer"
                target="_blank"
              >
                <Github aria-hidden="true" className="h-4 w-4" />
                Open GitHub
              </a>
            </div>

            {repoCount > 0 ? (
              <p className="mt-4 text-sm text-zinc-300">
                <span aria-hidden="true">🚀</span>{" "}
                {repoCount.toLocaleString("en-US")} repos generated
              </p>
            ) : null}

            <ol
              aria-label="Steps to generate a repo"
              className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3"
            >
              {steps.map((step, index) => (
                <li
                  className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4"
                  key={step}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-500/15 text-sm font-semibold text-purple-200">
                    {index + 1}
                  </span>
                  <p className="mt-3 text-sm font-medium text-zinc-100">
                    {step}
                  </p>
                </li>
              ))}
            </ol>
          </div>

          <aside className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-5 shadow-2xl shadow-purple-950/20">
            <div className="flex items-start justify-between gap-4 border-b border-zinc-800 pb-4">
              <div>
                <h2 className="text-lg font-semibold text-zinc-100">
                  Starter stacks
                </h2>
                <p className="mt-1 text-sm leading-6 text-zinc-300">
                  Choose the shape of the repo before AgentStack writes files.
                </p>
              </div>
              <CheckCircle2
                aria-hidden="true"
                className="mt-1 h-5 w-5 shrink-0 text-emerald-300"
              />
            </div>

            <div className="mt-2 divide-y divide-zinc-800">
              {stackDefinitions.map((stack) => (
                <div
                  className="flex items-start gap-3 py-4"
                  key={stack.id}
                >
                  <StackIcon icon={stack.icon} />
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium text-zinc-100">
                      {stack.name}
                    </h3>
                    <p className="mt-1 text-sm leading-5 text-zinc-300">
                      {stack.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 border-t border-zinc-800 pt-4">
              <h2 className="text-sm font-semibold text-zinc-100">
                Agent files included
              </h2>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                {agentFiles.map((file) => (
                  <li
                    className="flex min-w-0 items-center gap-2 text-sm text-zinc-300"
                    key={file.name}
                  >
                    <CheckCircle2
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 text-purple-300"
                    />
                    <code className="truncate font-mono text-xs text-zinc-100">
                      {file.name}
                    </code>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </section>

        <section className="border-t border-zinc-900 py-16 sm:py-20">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
              What gets generated
            </h2>
            <p className="mt-3 text-base leading-7 text-zinc-300">
              Every starter includes the app scaffold plus the agent files your
              editor and model need before the first change.
            </p>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.05fr]">
            <pre className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950/80 p-5 font-mono text-sm leading-7 shadow-2xl shadow-purple-950/10">
              <code>
                <span className="text-zinc-300">my-project/</span>
                {"\n"}
                <span className="text-purple-300">├── CLAUDE.md</span>
                {"\n"}
                <span className="text-purple-300">├── AGENT.md</span>
                {"\n"}
                <span className="text-purple-300">├── .cursorrules</span>
                {"\n"}
                <span className="text-purple-300">├── .windsurfrules</span>
                {"\n"}
                <span className="text-zinc-300">├── README.md</span>
                {"\n"}
                <span className="text-zinc-300">├── .gitignore</span>
                {"\n"}
                <span className="text-zinc-300">├── .env.example</span>
                {"\n"}
                <span className="text-zinc-300">└── src/ (stack files)</span>
              </code>
            </pre>

            <div className="grid gap-3 sm:grid-cols-2">
              {agentFiles.map((file) => (
                <article
                  className="rounded-lg border border-zinc-800 bg-zinc-900 p-4"
                  key={file.name}
                >
                  <FileText
                    aria-hidden="true"
                    className="h-4 w-4 text-purple-300"
                  />
                  <h3 className="mt-3 font-mono text-sm font-semibold text-zinc-100">
                    {file.name}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">
                    {file.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-zinc-900 py-16 sm:py-20">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-xl">
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
                Supported stacks
              </h2>
              <p className="mt-3 text-base leading-7 text-zinc-300">
                Pick the starter that matches the repo you want to ship.
              </p>
            </div>
            <Link
              className="inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-lg border border-zinc-800 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:border-zinc-600 hover:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-zinc-950"
              href="/generate"
            >
              Choose a stack
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            {stackDefinitions.map((stack) => (
              <span
                className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200"
                key={stack.id}
              >
                {stack.name}
              </span>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
