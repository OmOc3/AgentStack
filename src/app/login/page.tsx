import {
  CheckCircle2,
  Code2,
  Laptop,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { LoginPanel } from "@/components/LoginPanel";
import { auth } from "@/lib/auth";
import { getAuthProviderStatus } from "@/lib/env";

export const metadata: Metadata = {
  title: "Sign in — AgentStack",
};

type LoginPageProps = {
  searchParams: Promise<{
    callbackUrl?: string | string[];
  }>;
};

const workflowItems = [
  "Preview generated files",
  "Connect a GitHub account",
  "Create the repo",
] as const;

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const callbackUrl = getSafeCallbackUrl(params.callbackUrl);
  const session = await auth();
  const providerStatus = getAuthProviderStatus();

  return (
    <main
      aria-label="AgentStack sign in"
      className="min-h-screen bg-white text-[#171717]"
    >
      <section className="relative overflow-hidden px-5 py-6 sm:px-6 lg:py-8">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_50%_0%,#cfe7ff_0%,#edf7ff_38%,rgba(255,255,255,0)_72%)]"
        />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-8">
          <header className="flex h-16 items-center justify-between gap-4">
            <Link
              className="rounded text-base font-semibold tracking-tight text-[#171717] focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
              href="/"
            >
              AgentStack
            </Link>
            <nav aria-label="Sign in page navigation" className="flex gap-2">
              <Link
                className="inline-flex h-10 items-center justify-center rounded-lg px-3 text-sm font-medium text-[#60646c] transition hover:text-[#171717] focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                href="/"
              >
                Home
              </Link>
              <Link
                className="inline-flex h-10 items-center justify-center rounded-lg bg-black px-[18px] text-sm font-medium text-white transition hover:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                href="/generate"
              >
                Generate repo
              </Link>
            </nav>
          </header>

          <div className="grid items-start gap-10 pb-14 pt-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(22rem,26rem)] lg:pb-24 lg:pt-8">
            <div className="min-w-0">
              <p className="inline-flex rounded-full bg-[#f0f0f3] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.88px] text-[#171717]">
                Account access
              </p>
              <h1 className="mt-5 max-w-[40rem] text-[32px] font-semibold leading-[1.08] tracking-[-1px] text-[#171717] sm:text-5xl lg:text-[56px] lg:leading-[1.06] lg:tracking-[-1.5px]">
                Sign in before AgentStack writes to GitHub.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-[#60646c]">
                Pick the account method that fits the job. Use GitHub when you
                want AgentStack to create a repo on your account.
              </p>

              <div className="mt-10 max-w-xl">
                <DeviceMockup />
              </div>
            </div>

            <LoginPanel
              callbackUrl={callbackUrl}
              isSignedIn={Boolean(session?.user)}
              providerStatus={providerStatus}
              sessionLabel={session?.user?.name ?? session?.user?.email}
            />
          </div>
        </div>
      </section>

      <section className="border-t border-[#f0f0f3] bg-white px-5 py-16 sm:px-6 lg:py-24">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          {workflowItems.map((item, index) => (
            <article
              className="rounded-xl border border-[#dcdee0] bg-white p-5"
              key={item}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f0f0f3] text-sm font-semibold text-[#171717]">
                {index + 1}
              </span>
              <h2 className="mt-4 text-base font-semibold text-[#171717]">
                {item}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#60646c]">
                {getWorkflowDescription(index)}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function DeviceMockup() {
  return (
    <div className="relative rounded-2xl border border-[#dcdee0] bg-white p-3 shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
      <div className="rounded-xl border border-[#f0f0f3] bg-[#171717] p-4 text-white">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Laptop aria-hidden="true" className="h-4 w-4 text-[#b0b4ba]" />
            <span className="text-sm font-medium">AgentStack preview</span>
          </div>
          <Code2 aria-hidden="true" className="h-4 w-4 text-[#b0b4ba]" />
        </div>
        <div className="grid gap-3 pt-4 sm:grid-cols-[1fr_0.8fr]">
          <div className="space-y-2">
            {["CLAUDE.md", "AGENT.md", ".cursorrules"].map((file) => (
              <div
                className="flex items-center justify-between rounded-lg bg-[#1a1a1a] px-3 py-2"
                key={file}
              >
                <span className="font-mono text-xs text-white">{file}</span>
                <CheckCircle2
                  aria-hidden="true"
                  className="h-4 w-4 text-[#16a34a]"
                />
              </div>
            ))}
          </div>
          <div className="rounded-lg bg-white p-3 text-[#171717]">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck aria-hidden="true" className="h-4 w-4" />
              Repo checks
            </div>
            <p className="mt-2 text-xs leading-5 text-[#60646c]">
              Preview locked, file paths checked, GitHub token required.
            </p>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-6 right-5 hidden w-28 rounded-[24px] border border-[#dcdee0] bg-white p-2 shadow-[0_4px_12px_rgba(0,0,0,0.08)] sm:block">
        <div className="rounded-[18px] bg-[#fafafa] p-3">
          <Smartphone aria-hidden="true" className="mx-auto h-5 w-5" />
          <p className="mt-3 text-center text-[11px] font-medium leading-4 text-[#60646c]">
            Ready on web
          </p>
        </div>
      </div>
    </div>
  );
}

function getSafeCallbackUrl(value: string | string[] | undefined) {
  const callbackUrl = Array.isArray(value) ? value[0] : value;

  if (callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//")) {
    return callbackUrl;
  }

  return "/generate";
}

function getWorkflowDescription(index: number) {
  switch (index) {
    case 0:
      return "Review the generated files before anything is written to your account.";
    case 1:
      return "GitHub sign-in gives AgentStack the token it needs for repo creation.";
    default:
      return "Once the preview matches the request, AgentStack writes one initial commit.";
  }
}
