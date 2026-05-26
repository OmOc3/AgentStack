import { cookies } from "next/headers";
import type { Metadata } from "next";
import Link from "next/link";

import { GenerateForm } from "@/components/GenerateForm";
import { auth } from "@/lib/auth";
import { REPO_GENERATED_COOKIE } from "@/lib/rate-limit";
import { stackDefinitions } from "@/lib/stacks";

export const metadata: Metadata = {
  title: "Generate a repo — AgentStack",
};

export default async function GeneratePage() {
  const session = await auth();
  const cookieStore = await cookies();
  const hasGenerated = Boolean(cookieStore.get(REPO_GENERATED_COOKIE));

  return (
    <>
      <main className="min-h-screen bg-zinc-950 px-5 pb-20 pt-6 text-zinc-100 sm:px-6 sm:py-6 lg:py-10">
        <div className="mx-auto max-w-5xl">
          <header className="mb-10 flex items-center justify-between gap-4">
            <Link
              className="rounded text-base font-semibold tracking-tight focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-zinc-950"
              href="/"
            >
              AgentStack
            </Link>
            <Link
              className="rounded text-sm font-medium text-zinc-300 transition hover:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-zinc-950"
              href="/"
            >
              Back to home
            </Link>
          </header>

          <section className="mb-8 max-w-3xl">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Generate a repo
            </h1>
            <p className="mt-4 text-base leading-7 text-zinc-300">
              Name the project, choose a stack, preview the files, then connect
              GitHub to create the public repo.
            </p>
          </section>

          <GenerateForm
            hasGenerated={hasGenerated}
            isSignedIn={Boolean(session?.accessToken)}
            stacks={stackDefinitions}
            userName={session?.user?.name ?? session?.user?.email}
          />
        </div>
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-50 h-14 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur sm:hidden">
        <Link
          className="flex h-full items-center px-5 text-sm font-medium text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-zinc-950"
          href="/"
        >
          ← Back
        </Link>
      </nav>
    </>
  );
}
