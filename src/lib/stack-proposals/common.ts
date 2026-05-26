import type { GeneratedProposalFile } from "./types";

type PackageJsonOptions = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
};

export function finalizeProposalFiles(
  files: GeneratedProposalFile[],
): GeneratedProposalFile[] {
  return files.map((file) => ({
    ...file,
    content: withTrailingNewline(file.content),
  }));
}

export function gitignoreTemplate() {
  return `.DS_Store
node_modules/
.next/
out/
dist/
coverage/
.env
.env*.local
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
`;
}

export function nextPackageJsonTemplate(
  projectName: string,
  options: PackageJsonOptions = {},
) {
  return JSON.stringify(
    {
      name: toPackageName(projectName),
      version: "0.1.0",
      private: true,
      scripts: {
        dev: "next dev",
        build: "next build",
        start: "next start",
        lint: "eslint .",
        typecheck: "tsc --noEmit",
        ...options.scripts,
      },
      dependencies: {
        next: "^15.5.18",
        react: "^19.2.0",
        "react-dom": "^19.2.0",
        ...options.dependencies,
      },
      devDependencies: {
        "@eslint/eslintrc": "^3.3.1",
        "@types/node": "^24.10.1",
        "@types/react": "^19.2.6",
        "@types/react-dom": "^19.2.3",
        autoprefixer: "^10.4.22",
        eslint: "^9.39.1",
        "eslint-config-next": "^15.5.18",
        postcss: "^8.5.6",
        tailwindcss: "^3.4.18",
        typescript: "^5.9.3",
        ...options.devDependencies,
      },
    },
    null,
    2,
  );
}

export function nextTsconfigTemplate() {
  return JSON.stringify(
    {
      compilerOptions: {
        target: "ES2017",
        lib: ["dom", "dom.iterable", "esnext"],
        allowJs: false,
        skipLibCheck: true,
        strict: true,
        noEmit: true,
        esModuleInterop: true,
        module: "esnext",
        moduleResolution: "bundler",
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: "preserve",
        incremental: true,
        plugins: [{ name: "next" }],
        baseUrl: ".",
        paths: {
          "@/*": ["./src/*"],
        },
      },
      include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
      exclude: ["node_modules"],
    },
    null,
    2,
  );
}

export function nextConfigTemplate() {
  return `import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
`;
}

export function postcssConfigTemplate() {
  return `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`;
}

export function tailwindConfigTemplate() {
  return `import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
`;
}

export function nextGlobalsTemplate() {
  return `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: light;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: rgb(250 250 250);
  color: rgb(24 24 27);
}

a {
  color: inherit;
  text-decoration: none;
}
`;
}

function toPackageName(projectName: string) {
  return projectName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function withTrailingNewline(value: string) {
  return value.endsWith("\n") ? value : `${value}\n`;
}
