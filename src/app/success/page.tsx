import { Download, ExternalLink } from "lucide-react";
import { headers } from "next/headers";
import type { Metadata } from "next";
import Link from "next/link";

import { CopyFileButton } from "@/components/CopyFileButton";
import { CopyRepoButton } from "@/components/CopyRepoButton";
import { ShareRepoButton } from "@/components/ShareRepoButton";
import {
  CloneCommandCard,
  GeneratedRepoSummary,
  InstallCommandsCard,
  NextStepsChecklist,
  OpenInToolsPanel,
  type GeneratedRepoFileStats,
} from "@/components/success";
import type { GeneratedFile } from "@/lib/stacks";

export const metadata: Metadata = {
  title: "Repo created — AgentStack",
};

const includedFiles = [
  "CLAUDE.md",
  "AGENT.md",
  ".cursorrules",
  ".windsurfrules",
] as const;

const shareText = "I just generated an AI-ready repo with AgentStack";
const shareUrl = "https://agentstack.vercel.app";
const shareHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
  shareText,
)}&url=${encodeURIComponent(shareUrl)}`;

type SuccessPageProps = {
  searchParams: Promise<{
    pid?: string | string[];
    repo?: string | string[];
    stack?: string | string[];
  }>;
};

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams;
  const previewId = Array.isArray(params.pid) ? params.pid[0] : params.pid;
  const repoUrl = Array.isArray(params.repo) ? params.repo[0] : params.repo;
  const stackId = Array.isArray(params.stack) ? params.stack[0] : params.stack;
  const files = await getGeneratedFiles(previewId);
  const fileStats = getFileStats(files, previewId);

  return (
    <main className="min-h-screen bg-zinc-950 px-5 py-6 text-zinc-100 sm:px-6 lg:py-10">
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-8 flex items-center justify-between gap-4">
          <Link
            className="rounded text-base font-semibold tracking-tight focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-zinc-950"
            href="/"
          >
            AgentStack
          </Link>
          <Link
            className="rounded text-sm font-medium text-zinc-300 transition hover:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-zinc-950"
            href="/generate"
          >
            New repo
          </Link>
        </header>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)]">
          <div className="min-w-0 rounded-lg border border-zinc-800 bg-zinc-900/70 p-6 shadow-2xl shadow-purple-950/20 sm:p-8">
            <p className="text-sm font-medium text-purple-300">Repo created</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
              Your AI-ready repo is ready.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-300 sm:text-base">
              AgentStack added the repo files, app starter, and agent context.
              Clone it locally when you are ready to work.
            </p>

            {repoUrl ? (
              <>
                <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                  <p className="text-sm text-zinc-300">Repository URL</p>
                  <a
                    className="mt-2 flex min-w-0 items-center gap-2 rounded text-sm font-medium text-purple-200 transition hover:text-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-zinc-950"
                    href={repoUrl}
                    rel="noreferrer"
                    title={repoUrl}
                    target="_blank"
                  >
                    <span className="truncate">{repoUrl}</span>
                    <ExternalLink
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0"
                    />
                  </a>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <CopyRepoButton repoUrl={repoUrl} />
                  {previewId ? (
                    <a
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-zinc-950"
                      href={`/api/download?${new URLSearchParams({
                        previewId,
                      }).toString()}`}
                    >
                      <Download aria-hidden="true" className="h-4 w-4" />
                      Download ZIP
                    </a>
                  ) : null}
                  <ShareRepoButton href={shareHref} />
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
                No repo URL was provided. Go back to the generator and create a
                repo first.
              </div>
            )}
          </div>

          <aside className="min-w-0 rounded-lg border border-zinc-800 bg-zinc-900/70 p-6 shadow-2xl shadow-purple-950/10">
            <h2 className="text-lg font-semibold text-zinc-100">
              Files included
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {includedFiles.map((file) => (
                <span
                  className="rounded border border-purple-500/30 bg-purple-500/10 px-2 py-1 font-mono text-xs text-purple-200"
                  key={file}
                >
                  {file}
                </span>
              ))}
            </div>
            <p className="mt-4 text-sm leading-6 text-zinc-300">
              Plus stack-specific app files and config
            </p>

            {files ? (
              <details className="mt-6 rounded-lg border border-zinc-800 bg-zinc-950/70">
                <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-zinc-100 marker:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-zinc-950">
                  <span>Generated files</span>
                  <span className="text-xs font-normal text-zinc-300">
                    {files.length} files
                  </span>
                </summary>
                <ul className="divide-y divide-zinc-800 border-t border-zinc-800">
                  {files.map((file) => (
                    <li
                      className="flex items-center justify-between gap-3 px-4 py-3"
                      key={file.path}
                    >
                      <code className="min-w-0 flex-1 break-all text-xs text-zinc-300">
                        {file.path}
                      </code>
                      <CopyFileButton
                        content={file.content}
                      />
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
          </aside>
        </section>

        {repoUrl ? (
          <section className="mt-6 grid gap-5 lg:grid-cols-2">
            <GeneratedRepoSummary
              className="lg:col-span-2"
              fileStats={fileStats}
              repoUrl={repoUrl}
              stackId={stackId}
            />
            <CloneCommandCard repoUrl={repoUrl} />
            <InstallCommandsCard stackId={stackId} />
            <OpenInToolsPanel className="lg:col-span-2" repoUrl={repoUrl} />
            <NextStepsChecklist
              className="lg:col-span-2"
              previewStatus={fileStats?.previewStatus}
              repoUrl={repoUrl}
              stackId={stackId}
            />
          </section>
        ) : null}
      </div>
    </main>
  );
}

async function getGeneratedFiles(previewId?: string) {
  if (!previewId) {
    return null;
  }

  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");

  if (!host) {
    return null;
  }

  const protocol = (
    headerStore.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1")
      ? "http"
      : "https")
  ).split(",")[0];
  const filesUrl = new URL(
    `/api/files?pid=${encodeURIComponent(previewId)}`,
    `${protocol}://${host}`,
  );

  try {
    const response = await fetch(filesUrl, { cache: "no-store" });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { files?: unknown };

    if (!isGeneratedFileList(data.files)) {
      return null;
    }

    return data.files;
  } catch {
    return null;
  }
}

function isGeneratedFileList(value: unknown): value is GeneratedFile[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
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

function getFileStats(
  files: GeneratedFile[] | null,
  previewId?: string,
): GeneratedRepoFileStats | null {
  if (files) {
    return {
      fileCount: files.length,
      totalBytes: files.reduce((total, file) => total + file.content.length, 0),
      files: files.map((file) => ({
        path: file.path,
        sizeBytes: file.content.length,
      })),
      previewStatus: "available",
    };
  }

  return previewId ? { previewStatus: "expired" } : null;
}
