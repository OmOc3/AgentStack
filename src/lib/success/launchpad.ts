export type InstallCommand = {
  label: string;
  command: string;
  description?: string | undefined;
};

export type InstallCommandGroup = {
  stackId: string | null;
  stackName: string;
  commands: readonly InstallCommand[];
  note: string;
  hasStackSpecificCommands: boolean;
};

export type OpenInToolId = "github" | "cursor" | "claude-code" | "windsurf";

export type OpenInToolHint = {
  id: OpenInToolId;
  label: string;
  description: string;
  command?: string | undefined;
  href?: string | undefined;
  disabledReason?: string | undefined;
};

type StackInstallConfig = {
  name: string;
  envFile: ".env" | ".env.local";
  extraCommands?: readonly InstallCommand[] | undefined;
  note?: string | undefined;
};

type KnownStackId =
  | "next-tailwind"
  | "next-supabase"
  | "next-firebase"
  | "next-drizzle"
  | "expo-firebase"
  | "t3-stack"
  | "next-prisma"
  | "sveltekit-tailwind"
  | "remix-tailwind"
  | "astro-tailwind"
  | "next-saas-starter"
  | "ai-chatbot-starter"
  | "marketing-content-starter";

const stackInstallConfig: Record<KnownStackId, StackInstallConfig> = {
  "next-tailwind": {
    name: "Next.js + Tailwind",
    envFile: ".env.local",
  },
  "next-supabase": {
    name: "Next.js + Tailwind + Supabase",
    envFile: ".env.local",
  },
  "next-firebase": {
    name: "Next.js + Tailwind + Firebase",
    envFile: ".env.local",
  },
  "next-drizzle": {
    name: "Next.js + Tailwind + Drizzle + Neon",
    envFile: ".env.local",
    extraCommands: [
      {
        label: "Generate database files",
        command: "npm run db:generate",
        description: "Run this after you add DATABASE_URL.",
      },
    ],
  },
  "expo-firebase": {
    name: "Expo + Firebase",
    envFile: ".env",
    note: "Expo reads EXPO_PUBLIC values from .env during local development.",
  },
  "t3-stack": {
    name: "T3 stack",
    envFile: ".env.local",
    extraCommands: [
      {
        label: "Generate Prisma client",
        command: "npm run db:generate",
        description: "Run this after dependencies install.",
      },
    ],
  },
  "next-prisma": {
    name: "Next.js + Tailwind + Prisma",
    envFile: ".env.local",
    extraCommands: [
      {
        label: "Generate Prisma client",
        command: "npm run db:generate",
        description: "Run this after dependencies install.",
      },
    ],
  },
  "sveltekit-tailwind": {
    name: "SvelteKit + Tailwind",
    envFile: ".env",
  },
  "remix-tailwind": {
    name: "Remix + Tailwind",
    envFile: ".env",
  },
  "astro-tailwind": {
    name: "Astro + Tailwind",
    envFile: ".env",
  },
  "next-saas-starter": {
    name: "Next.js SaaS Starter",
    envFile: ".env.local",
    extraCommands: [
      {
        label: "Generate Prisma client",
        command: "npm run db:generate",
        description: "Run this after dependencies install.",
      },
    ],
  },
  "ai-chatbot-starter": {
    name: "AI Chatbot Starter",
    envFile: ".env.local",
    note: "The demo provider runs without secrets. Add provider keys after you choose a model vendor.",
  },
  "marketing-content-starter": {
    name: "Marketing Content Starter",
    envFile: ".env.local",
    note: "Set NEXT_PUBLIC_SITE_URL before deploying the generated site.",
  },
};

export function getCloneCommand(repoUrl?: string | null) {
  const normalizedRepoUrl = normalizeRepoUrl(repoUrl);

  if (!normalizedRepoUrl) {
    return "";
  }

  return `git clone ${normalizedRepoUrl}`;
}

export function getInstallCommandsForStack(
  stackId?: string | null,
): InstallCommandGroup {
  const knownStackId = getKnownStackId(stackId);
  const config = knownStackId ? stackInstallConfig[knownStackId] : null;
  const envFile = config?.envFile ?? ".env.local";
  const commands: InstallCommand[] = [
    {
      label: "Install dependencies",
      command: "npm install",
    },
    {
      label: "Copy the environment sample",
      command: `cp .env.example ${envFile}`,
      description: "Skip this if the repo does not include .env.example.",
    },
    ...(config?.extraCommands ?? []),
    {
      label: "Start the dev server",
      command: "npm run dev",
    },
  ];

  return {
    stackId: knownStackId,
    stackName: config?.name ?? "Generated app",
    commands,
    note:
      config?.note ??
      (config
        ? "These commands use the npm scripts written into the generated package.json."
        : "Stack ID was not provided. Check package.json before running stack-specific setup."),
    hasStackSpecificCommands: Boolean(config),
  };
}

export function getOpenInToolHints(
  repoUrl?: string | null,
): readonly OpenInToolHint[] {
  const normalizedRepoUrl = normalizeRepoUrl(repoUrl);
  const repoDirectoryName = getRepoDirectoryName(normalizedRepoUrl);
  const githubHref = getGitHubHref(normalizedRepoUrl);
  const directoryPrefix = repoDirectoryName ? `cd ${repoDirectoryName}\n` : "";

  return [
    githubHref
      ? {
          id: "github",
          label: "GitHub",
          description: "Review the generated files and repository settings.",
          href: githubHref,
        }
      : {
          id: "github",
          label: "GitHub",
          description: "Review the generated files and repository settings.",
          disabledReason: normalizedRepoUrl
            ? "This repo URL does not point to GitHub."
            : "Repo URL not provided yet.",
        },
    {
      id: "cursor",
      label: "Cursor",
      description: repoDirectoryName
        ? "Open the cloned folder in Cursor."
        : "Run this from the cloned project folder.",
      command: `${directoryPrefix}cursor .`,
    },
    {
      id: "claude-code",
      label: "Claude Code",
      description: repoDirectoryName
        ? "Start Claude Code with the repo context loaded."
        : "Run this from the cloned project folder.",
      command: `${directoryPrefix}claude`,
    },
    {
      id: "windsurf",
      label: "Windsurf",
      description: repoDirectoryName
        ? "Open the cloned folder in Windsurf."
        : "Run this from the cloned project folder.",
      command: `${directoryPrefix}windsurf .`,
    },
  ];
}

export function getSuccessStackName(stackId?: string | null) {
  const knownStackId = getKnownStackId(stackId);

  return knownStackId ? stackInstallConfig[knownStackId].name : "Generated app";
}

function normalizeRepoUrl(repoUrl?: string | null) {
  const trimmedRepoUrl = repoUrl?.trim();

  if (!trimmedRepoUrl || /[\s\u0000-\u001f\u007f]/.test(trimmedRepoUrl)) {
    return null;
  }

  return trimmedRepoUrl;
}

function getKnownStackId(stackId?: string | null): KnownStackId | null {
  if (!stackId) {
    return null;
  }

  return stackId in stackInstallConfig ? (stackId as KnownStackId) : null;
}

function getRepoDirectoryName(repoUrl?: string | null) {
  const path = getRepoPath(repoUrl);

  if (!path) {
    return null;
  }

  const parts = path.split("/").filter(Boolean);
  const lastPart = parts.at(-1);

  if (!lastPart) {
    return null;
  }

  return stripGitSuffix(lastPart);
}

function getRepoPath(repoUrl?: string | null) {
  if (!repoUrl) {
    return null;
  }

  try {
    return new URL(repoUrl).pathname;
  } catch {
    const sshMatch = repoUrl.match(/^[^@]+@[^:]+:(.+)$/);
    return sshMatch?.[1] ?? repoUrl;
  }
}

function getGitHubHref(repoUrl?: string | null) {
  if (!repoUrl) {
    return null;
  }

  try {
    const url = new URL(repoUrl);

    if (!isGitHubHost(url.hostname)) {
      return null;
    }

    return buildGitHubHref(url.pathname);
  } catch {
    const sshMatch = repoUrl.match(/^git@github\.com:([^/]+)\/([^/]+)$/i);

    if (!sshMatch) {
      return null;
    }

    const owner = sshMatch[1];
    const repo = stripGitSuffix(sshMatch[2]);

    return owner && repo ? toGitHubHref(owner, repo) : null;
  }
}

function buildGitHubHref(pathname: string) {
  const [owner, repoWithSuffix] = pathname.split("/").filter(Boolean);
  const repo = stripGitSuffix(repoWithSuffix);

  return owner && repo ? toGitHubHref(owner, repo) : null;
}

function toGitHubHref(owner: string, repo: string) {
  if (!isSafeGitHubPathPart(owner) || !isSafeGitHubPathPart(repo)) {
    return null;
  }

  return `https://github.com/${owner}/${repo}`;
}

function stripGitSuffix(value?: string) {
  return value?.replace(/\.git$/i, "") ?? "";
}

function isGitHubHost(hostname: string) {
  const normalizedHostname = hostname.toLowerCase();

  return (
    normalizedHostname === "github.com" ||
    normalizedHostname === "www.github.com"
  );
}

function isSafeGitHubPathPart(value: string) {
  return /^[a-z0-9_.-]+$/i.test(value);
}
