"use client";

import { trackRepoShared } from "@/lib/events";

type ShareRepoButtonProps = {
  href: string;
};

export function ShareRepoButton({ href }: ShareRepoButtonProps) {
  return (
    <a
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-zinc-950"
      href={href}
      onClick={trackRepoShared}
      rel="noreferrer"
      target="_blank"
    >
      <span
        aria-hidden="true"
        className="flex h-4 w-4 items-center justify-center text-xs font-semibold leading-none"
      >
        X
      </span>
      Share on X
    </a>
  );
}
