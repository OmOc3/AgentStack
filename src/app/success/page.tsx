import { ExternalLink } from "lucide-react";
import Link from "next/link";

import { CopyRepoButton } from "@/components/CopyRepoButton";

type SuccessPageProps = {
  searchParams: Promise<{
    repo?: string | string[];
  }>;
};

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams;
  const repoUrl = Array.isArray(params.repo) ? params.repo[0] : params.repo;

  return (
    <main className="flex min-h-screen items-center bg-zinc-950 px-5 py-10 text-zinc-100 sm:px-6">
      <section className="mx-auto w-full max-w-2xl rounded-lg border border-zinc-800 bg-zinc-900/70 p-6 shadow-2xl shadow-purple-950/20 sm:p-8">
        <p className="text-sm font-medium text-purple-300">Repo created</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Your starter repo is ready.
        </h1>

        {repoUrl ? (
          <>
            <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-950 p-4">
              <p className="text-sm text-zinc-500">Repository URL</p>
              <a
                className="mt-2 flex items-center gap-2 break-all text-sm font-medium text-purple-200 transition hover:text-purple-100"
                href={repoUrl}
                rel="noreferrer"
                target="_blank"
              >
                {repoUrl}
                <ExternalLink aria-hidden="true" className="h-4 w-4 shrink-0" />
              </a>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <CopyRepoButton repoUrl={repoUrl} />
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-zinc-950"
                href="/generate"
              >
                Generate Another
              </Link>
            </div>
          </>
        ) : (
          <div className="mt-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm leading-6 text-amber-100">
            No repo URL was provided. Go back to the generator and create a repo
            first.
          </div>
        )}
      </section>
    </main>
  );
}
