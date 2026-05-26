"use client";

import { ArrowRight, Github, Loader2, Mail } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { type FormEventHandler, type ReactNode, useState } from "react";

import type { AuthProviderStatus } from "@/lib/env";

type LoginPanelProps = {
  callbackUrl: string;
  isSignedIn: boolean;
  providerStatus: AuthProviderStatus;
  sessionLabel?: string | null | undefined;
};

export function LoginPanel({
  callbackUrl,
  isSignedIn,
  providerStatus,
  sessionLabel,
}: LoginPanelProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [pendingProvider, setPendingProvider] = useState<string | null>(null);

  const isBusy = pendingProvider !== null;

  async function handleOAuthSignIn(provider: "github" | "google") {
    setError("");
    setPendingProvider(provider);

    try {
      await signIn(provider, { callbackUrl });
    } catch {
      setPendingProvider(null);
      setError("Sign-in could not start. Check this provider's setup.");
    }
  }

  const handleEmailSignIn: FormEventHandler<HTMLFormElement> = async (
    event,
  ) => {
    event.preventDefault();
    setError("");

    if (!providerStatus.email) {
      setError("Email sign-in needs an access code in the environment.");
      return;
    }

    if (!email.trim() || !code) {
      setError("Enter your email and access code.");
      return;
    }

    setPendingProvider("email");

    const result = await signIn("email", {
      callbackUrl,
      code,
      email,
      redirect: false,
    });

    setPendingProvider(null);

    if (result?.error) {
      setError("Check the email and access code, then try again.");
      return;
    }

    router.push(result?.url ?? callbackUrl);
    router.refresh();
  };

  return (
    <section
      aria-label="Sign in options"
      className="rounded-xl border border-[#dcdee0] bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.04)] sm:p-6"
    >
      <div className="border-b border-[#f0f0f3] pb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.88px] text-[#60646c]">
          Account
        </p>
        <h1 className="mt-3 text-[28px] font-semibold leading-[1.2] tracking-[-0.84px] text-[#171717]">
          Sign in to AgentStack
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#60646c]">
          GitHub is required when AgentStack creates a repo. Google and email
          are ready for account access.
        </p>
      </div>

      {isSignedIn ? (
        <div className="mt-5 rounded-lg border border-[#dcdee0] bg-[#fafafa] p-4 text-sm text-[#60646c]">
          <p className="font-medium text-[#171717]">
            Signed in{sessionLabel ? ` as ${sessionLabel}` : ""}.
          </p>
          <button
            className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-black px-[18px] text-sm font-medium text-white transition hover:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
            onClick={() => router.push(callbackUrl)}
            type="button"
          >
            Continue
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      <div className="mt-5 grid gap-3">
        <ProviderButton
          disabled={!providerStatus.github || isBusy}
          icon={<Github aria-hidden="true" className="h-4 w-4" />}
          isPrimary
          isLoading={pendingProvider === "github"}
          label="Continue with GitHub"
          onClick={() => void handleOAuthSignIn("github")}
          statusText={providerStatus.github ? null : "Not configured"}
        />
        <ProviderButton
          disabled={!providerStatus.google || isBusy}
          icon={<GoogleMark />}
          isLoading={pendingProvider === "google"}
          label="Continue with Google"
          onClick={() => void handleOAuthSignIn("google")}
          statusText={providerStatus.google ? null : "Not configured"}
        />
      </div>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-[#f0f0f3]" />
        <span className="text-xs text-[#999999]">or use email</span>
        <div className="h-px flex-1 bg-[#f0f0f3]" />
      </div>

      <form className="space-y-3" onSubmit={handleEmailSignIn}>
        <div>
          <label
            className="text-sm font-medium text-[#171717]"
            htmlFor="loginEmail"
          >
            Email
          </label>
          <div className="relative mt-2">
            <Mail
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#999999]"
            />
            <input
              autoComplete="email"
              className="h-11 w-full rounded-lg border border-[#dcdee0] bg-white pl-10 pr-4 text-sm text-[#171717] outline-none transition placeholder:text-[#999999] focus:border-[#171717] focus:ring-2 focus:ring-[#171717]/10"
              disabled={isBusy}
              id="loginEmail"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              type="email"
              value={email}
            />
          </div>
        </div>

        <div>
          <label
            className="text-sm font-medium text-[#171717]"
            htmlFor="loginCode"
          >
            Access code
          </label>
          <input
            autoComplete="one-time-code"
            className="mt-2 h-11 w-full rounded-lg border border-[#dcdee0] bg-white px-4 text-sm text-[#171717] outline-none transition placeholder:text-[#999999] focus:border-[#171717] focus:ring-2 focus:ring-[#171717]/10 disabled:bg-[#fafafa] disabled:text-[#999999]"
            disabled={!providerStatus.email || isBusy}
            id="loginCode"
            onChange={(event) => setCode(event.target.value)}
            placeholder={
              providerStatus.email ? "Enter access code" : "Not configured"
            }
            type="password"
            value={code}
          />
        </div>

        {error ? (
          <p
            aria-live="polite"
            className="rounded-lg border border-[#eb8e90]/60 bg-[#fff8f8] px-3 py-2 text-sm text-[#8a1f28]"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <button
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-black px-[18px] text-sm font-medium text-white transition hover:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#cccccc] disabled:text-white"
          disabled={!providerStatus.email || isBusy}
          type="submit"
        >
          {pendingProvider === "email" ? (
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
          ) : (
            <Mail aria-hidden="true" className="h-4 w-4" />
          )}
          Continue with email
        </button>
      </form>
    </section>
  );
}

function ProviderButton({
  disabled,
  icon,
  isLoading = false,
  isPrimary = false,
  label,
  onClick,
  statusText,
}: {
  disabled: boolean;
  icon: ReactNode;
  isLoading?: boolean;
  isPrimary?: boolean;
  label: string;
  onClick: () => void;
  statusText?: string | null;
}) {
  return (
    <button
      className={
        isPrimary
          ? "inline-flex h-11 items-center justify-between gap-3 rounded-lg bg-black px-4 text-sm font-medium text-white transition hover:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#cccccc]"
          : "inline-flex h-11 items-center justify-between gap-3 rounded-lg border border-[#dcdee0] bg-white px-4 text-sm font-medium text-[#171717] transition hover:bg-[#fafafa] focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#fafafa] disabled:text-[#999999]"
      }
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <span className="flex items-center gap-2">
        {isLoading ? (
          <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
        ) : (
          icon
        )}
        {label}
      </span>
      {statusText ? <span className="text-xs opacity-75">{statusText}</span> : null}
    </button>
  );
}

function GoogleMark() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 18 18"
    >
      <path
        d="M16.62 9.18c0-.58-.05-1.13-.15-1.66H9v3.15h4.27a3.67 3.67 0 0 1-1.58 2.4v2h2.57c1.5-1.39 2.36-3.43 2.36-5.89Z"
        fill="#4285F4"
      />
      <path
        d="M9 16.92c2.14 0 3.94-.71 5.25-1.93l-2.57-2A4.8 4.8 0 0 1 9 13.75a4.72 4.72 0 0 1-4.45-3.26H1.9v2.06A7.92 7.92 0 0 0 9 16.92Z"
        fill="#34A853"
      />
      <path
        d="M4.55 10.49A4.76 4.76 0 0 1 4.3 9c0-.52.09-1.02.25-1.49V5.45H1.9A7.9 7.9 0 0 0 1.08 9c0 1.28.3 2.49.82 3.55l2.65-2.06Z"
        fill="#FBBC05"
      />
      <path
        d="M9 4.25c1.16 0 2.2.4 3.02 1.18l2.28-2.28A7.63 7.63 0 0 0 9 1.08a7.92 7.92 0 0 0-7.1 4.37l2.65 2.06A4.72 4.72 0 0 1 9 4.25Z"
        fill="#EA4335"
      />
    </svg>
  );
}
