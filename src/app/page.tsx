import { ArrowRight, CheckCircle2, GitBranch, Github } from "lucide-react";
import Link from "next/link";

import { StackIcon } from "@/components/StackIcon";
import { stackDefinitions } from "@/lib/stacks";

const steps = [
  "Name the repo",
  "Choose a starter stack",
  "Sign in with GitHub",
] as const;

export default function Page() {
  return (
    <main className="min-h-screen bg-zinc-950 px-5 py-6 text-zinc-100 sm:px-6 lg:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col">
        <header className="flex items-center justify-between gap-4">
          <Link className="text-base font-semibold tracking-tight" href="/">
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
            <h1 className="text-4xl font-semibold tracking-tight text-zinc-50 sm:text-5xl lg:text-6xl">
              Start a repo that already knows how agents should work.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
              Pick a stack, connect GitHub, and AgentStack creates the repo with
              app files, setup notes, and agent instructions in place.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-purple-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-zinc-950"
                href="/generate"
              >
                Generate a repo
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
              <a
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-zinc-800 px-5 py-3 text-sm font-medium text-zinc-100 transition hover:border-zinc-600 hover:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-zinc-950"
                href="https://github.com"
                rel="noreferrer"
                target="_blank"
              >
                <Github aria-hidden="true" className="h-4 w-4" />
                Open GitHub
              </a>
            </div>

            <ol className="mt-10 grid gap-3 sm:grid-cols-3">
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
                <p className="mt-1 text-sm leading-6 text-zinc-400">
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
                    <p className="mt-1 text-sm leading-5 text-zinc-500">
                      {stack.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
