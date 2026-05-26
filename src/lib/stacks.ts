export const stackIds = [
  "next-tailwind",
  "next-supabase",
  "next-firebase",
  "next-drizzle",
  "expo-firebase",
  "t3-stack",
  "next-prisma",
  "sveltekit-tailwind",
  "remix-tailwind",
  "astro-tailwind",
] as const;

export type StackId = (typeof stackIds)[number];
export type StackIcon =
  | "next"
  | "supabase"
  | "firebase"
  | "drizzle"
  | "expo";

export type StackDefinition = {
  id: StackId;
  name: string;
  description: string;
  icon: StackIcon;
};

export type GeneratedFile = {
  path: string;
  content: string;
};

export const stackDefinitions: StackDefinition[] = [
  {
    id: "next-tailwind",
    name: "Next.js + Tailwind",
    description: "A clean App Router starter with TypeScript and Tailwind.",
    icon: "next",
  },
  {
    id: "next-supabase",
    name: "Next.js + Tailwind + Supabase",
    description: "Next.js with Supabase client setup and auth middleware.",
    icon: "supabase",
  },
  {
    id: "next-firebase",
    name: "Next.js + Tailwind + Firebase",
    description: "Next.js with Firebase client and Admin SDK helpers.",
    icon: "firebase",
  },
  {
    id: "next-drizzle",
    name: "Next.js + Tailwind + Drizzle + Neon",
    description: "Next.js with Drizzle ORM and a Neon database connection.",
    icon: "drizzle",
  },
  {
    id: "expo-firebase",
    name: "Expo + Firebase",
    description: "An Expo Router starter using Firebase on SDK 55.",
    icon: "expo",
  },
  {
    id: "t3-stack",
    name: "T3 Stack",
    description: "Next.js + tRPC + Prisma + NextAuth + Tailwind",
    icon: "next",
  },
  {
    id: "next-prisma",
    name: "Next.js + Prisma + PostgreSQL",
    description: "Next.js App Router with Prisma ORM and PostgreSQL",
    icon: "next",
  },
  {
    id: "sveltekit-tailwind",
    name: "SvelteKit + Tailwind",
    description: "SvelteKit with TypeScript and Tailwind CSS",
    icon: "next",
  },
  {
    id: "remix-tailwind",
    name: "Remix + Tailwind",
    description: "Remix with TypeScript and Tailwind CSS",
    icon: "next",
  },
  {
    id: "astro-tailwind",
    name: "Astro + Tailwind",
    description: "Astro with Tailwind CSS integration",
    icon: "next",
  },
];

export function isStackId(value: unknown): value is StackId {
  return (
    typeof value === "string" &&
    (stackIds as readonly string[]).includes(value)
  );
}

export function getStackDefinition(stackId: StackId) {
  return stackDefinitions.find((stack) => stack.id === stackId);
}

export function getStaticFiles(projectName: string, stack: StackDefinition) {
  const files: GeneratedFile[] = [
    {
      path: "README.md",
      content: readmeTemplate(projectName, stack.name),
    },
    {
      path: ".gitignore",
      content: gitignoreTemplate(),
    },
    {
      path: ".env.example",
      content: envExampleTemplate(stack.id),
    },
    ...stackFileBuilders[stack.id](projectName),
  ];

  return files.map((file) => ({
    ...file,
    content: withTrailingNewline(file.content),
  }));
}

export function mergeGeneratedFiles(files: GeneratedFile[]) {
  const deduped = new Map<string, GeneratedFile>();

  for (const file of files) {
    deduped.set(file.path, {
      ...file,
      content: withTrailingNewline(file.content),
    });
  }

  return Array.from(deduped.values());
}

const stackFileBuilders: Record<StackId, (projectName: string) => GeneratedFile[]> =
  {
    "next-tailwind": (projectName) => nextTailwindFiles(projectName),
    "next-supabase": (projectName) => [
      ...nextTailwindFiles(projectName, {
        dependencies: {
          "@supabase/ssr": "^0.7.0",
          "@supabase/supabase-js": "^2.84.0",
        },
      }),
      {
        path: "src/lib/supabase.ts",
        content: supabaseClientTemplate(),
      },
      {
        path: "src/middleware.ts",
        content: supabaseMiddlewareTemplate(),
      },
      {
        path: "supabase/migrations/.gitkeep",
        content: "",
      },
    ],
    "next-firebase": (projectName) => [
      ...nextTailwindFiles(projectName, {
        dependencies: {
          firebase: "^12.6.0",
          "firebase-admin": "^13.6.0",
        },
      }),
      {
        path: "src/lib/firebase.ts",
        content: firebaseClientTemplate(),
      },
      {
        path: "src/lib/firebase-admin.ts",
        content: firebaseAdminTemplate(),
      },
      {
        path: "firestore.rules",
        content: firestoreRulesTemplate(),
      },
    ],
    "next-drizzle": (projectName) => [
      ...nextTailwindFiles(projectName, {
        dependencies: {
          "@neondatabase/serverless": "^1.0.2",
          "drizzle-orm": "^0.45.0",
        },
        devDependencies: {
          "drizzle-kit": "^0.31.7",
        },
        scripts: {
          "db:generate": "drizzle-kit generate",
          "db:migrate": "drizzle-kit migrate",
          "db:studio": "drizzle-kit studio",
        },
      }),
      {
        path: "src/db/schema.ts",
        content: drizzleSchemaTemplate(),
      },
      {
        path: "src/db/index.ts",
        content: drizzleIndexTemplate(),
      },
      {
        path: "drizzle.config.ts",
        content: drizzleConfigTemplate(),
      },
    ],
    "expo-firebase": (projectName) => expoFirebaseFiles(projectName),
    "t3-stack": (projectName) => t3StackFiles(projectName),
    "next-prisma": (projectName) => nextPrismaFiles(projectName),
    "sveltekit-tailwind": (projectName) => svelteKitTailwindFiles(projectName),
    "remix-tailwind": (projectName) => remixTailwindFiles(projectName),
    "astro-tailwind": (projectName) => astroTailwindFiles(projectName),
  };

function readmeTemplate(projectName: string, stackName: string) {
  return `# ${projectName}

Generated with AgentStack for ${stackName}.

## Getting Started

Install dependencies:

~~~bash
npm install
~~~

Copy the example environment file:

~~~bash
cp .env.example .env.local
~~~

Start the development server:

~~~bash
npm run dev
~~~

## Agent Notes

- Read CLAUDE.md, AGENT.md, .cursorrules, and .windsurfrules before changing code.
- Keep changes small and easy to review.
- Run the listed checks before handing work back.
`;
}

function gitignoreTemplate() {
  return `.DS_Store
node_modules/
.next/
out/
dist/
build/
.expo/
coverage/
.env
.env*.local
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
`;
}

function envExampleTemplate(stackId: StackId) {
  if (stackId === "next-supabase") {
    return `NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
`;
  }

  if (stackId === "next-firebase") {
    return `NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
`;
  }

  if (stackId === "next-drizzle") {
    return `DATABASE_URL=
`;
  }

  if (stackId === "expo-firebase") {
    return `EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
`;
  }

  if (stackId === "t3-stack") {
    return `DATABASE_URL=
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=
`;
  }

  if (stackId === "next-prisma") {
    return `DATABASE_URL=
`;
  }

  if (stackId === "sveltekit-tailwind") {
    return `PUBLIC_APP_URL=http://localhost:5173
`;
  }

  if (stackId === "remix-tailwind") {
    return `APP_URL=http://localhost:3000
`;
  }

  if (stackId === "astro-tailwind") {
    return `PUBLIC_APP_URL=http://localhost:4321
`;
  }

  return `NEXT_PUBLIC_APP_URL=http://localhost:3000
`;
}

function nextTailwindFiles(
  projectName: string,
  options: {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    scripts?: Record<string, string>;
  } = {},
) {
  return [
    {
      path: "src/app/layout.tsx",
      content: nextLayoutTemplate(projectName),
    },
    {
      path: "src/app/page.tsx",
      content: nextPageTemplate(projectName),
    },
    {
      path: "src/app/globals.css",
      content: nextGlobalsTemplate(),
    },
    {
      path: "tailwind.config.ts",
      content: tailwindConfigTemplate(),
    },
    {
      path: "postcss.config.mjs",
      content: postcssConfigTemplate(),
    },
    {
      path: "tsconfig.json",
      content: nextTsconfigTemplate(),
    },
    {
      path: "next.config.ts",
      content: nextConfigTemplate(),
    },
    {
      path: "package.json",
      content: packageJsonTemplate(projectName, options),
    },
  ];
}

function packageJsonTemplate(
  projectName: string,
  options: {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    scripts?: Record<string, string>;
  },
) {
  return JSON.stringify(
    {
      name: projectName,
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

function nextLayoutTemplate(projectName: string) {
  return `import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "${projectName}",
  description: "Generated by AgentStack.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`;
}

function nextPageTemplate(projectName: string) {
  return `const checklist = [
  "Update the product direction in README.md.",
  "Add environment values from .env.example.",
  "Read CLAUDE.md, AGENT.md, .cursorrules, and .windsurfrules before the first agent run.",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-16 text-zinc-100">
      <section className="mx-auto flex max-w-3xl flex-col gap-8">
        <div className="space-y-4">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-purple-300">
            Agent-ready starter
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
            ${projectName}
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-zinc-300">
            The repo is ready for a human developer and an AI coding agent to
            work from the same starting point.
          </p>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-6">
          <h2 className="text-lg font-medium">Before you build</h2>
          <ul className="mt-4 space-y-3 text-sm text-zinc-300">
            {checklist.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-purple-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
`;
}

function nextGlobalsTemplate() {
  return `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: dark;
}

body {
  margin: 0;
  background: rgb(9 9 11);
  color: rgb(244 244 245);
}
`;
}

function tailwindConfigTemplate() {
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

function postcssConfigTemplate() {
  return `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`;
}

function nextTsconfigTemplate() {
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

function nextConfigTemplate() {
  return `import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
`;
}

function supabaseClientTemplate() {
  return `import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
`;
}

function supabaseMiddlewareTemplate() {
  return `import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
`;
}

function firebaseClientTemplate() {
  return `import { getApp, getApps, initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);
`;
}

function firebaseAdminTemplate() {
  return `import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";

export function getAdminApp() {
  if (getApps().length) {
    return getApp();
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\\\n/g, "\\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Missing Firebase Admin environment variables.");
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}
`;
}

function firestoreRulesTemplate() {
  return `rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
`;
}

function drizzleSchemaTemplate() {
  return `import { pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
`;
}

function drizzleIndexTemplate() {
  return `import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required.");
}

const sql = neon(process.env.DATABASE_URL);

export const db = drizzle(sql, { schema });
`;
}

function drizzleConfigTemplate() {
  return `import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
`;
}

function expoFirebaseFiles(projectName: string): GeneratedFile[] {
  return [
    {
      path: "app/(tabs)/index.tsx",
      content: expoIndexTemplate(projectName),
    },
    {
      path: "app/_layout.tsx",
      content: expoLayoutTemplate(),
    },
    {
      path: "lib/firebase.ts",
      content: expoFirebaseClientTemplate(),
    },
    {
      path: "constants/Colors.ts",
      content: expoColorsTemplate(),
    },
    {
      path: "package.json",
      content: expoPackageJsonTemplate(projectName),
    },
    {
      path: "app.json",
      content: expoAppJsonTemplate(projectName),
    },
    {
      path: "tsconfig.json",
      content: expoTsconfigTemplate(),
    },
  ];
}

function expoIndexTemplate(projectName: string) {
  return `import { StyleSheet, Text, View } from "react-native";
import { Colors } from "@/constants/Colors";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.kicker}>Agent-ready starter</Text>
      <Text style={styles.title}>${projectName}</Text>
      <Text style={styles.body}>
        Firebase is configured in lib/firebase.ts. Add your environment values,
        then build the first screen around the product workflow.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: Colors.dark.background,
  },
  kicker: {
    color: Colors.dark.accent,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  title: {
    marginTop: 12,
    color: Colors.dark.text,
    fontSize: 38,
    fontWeight: "800",
  },
  body: {
    marginTop: 16,
    maxWidth: 520,
    color: Colors.dark.muted,
    fontSize: 17,
    lineHeight: 26,
  },
});
`;
}

function expoLayoutTemplate() {
  return `import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="light" />
    </>
  );
}
`;
}

function expoFirebaseClientTemplate() {
  return `import { getApp, getApps, initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);
`;
}

function expoColorsTemplate() {
  return `export const Colors = {
  dark: {
    background: "#09090b",
    text: "#fafafa",
    muted: "#a1a1aa",
    accent: "#c084fc",
  },
  light: {
    background: "#fafafa",
    text: "#18181b",
    muted: "#71717a",
    accent: "#7e22ce",
  },
} as const;
`;
}

function expoPackageJsonTemplate(projectName: string) {
  return JSON.stringify(
    {
      name: projectName,
      version: "0.1.0",
      private: true,
      main: "expo-router/entry",
      scripts: {
        dev: "expo start",
        android: "expo start --android",
        ios: "expo start --ios",
        web: "expo start --web",
        lint: "eslint .",
        typecheck: "tsc --noEmit",
      },
      dependencies: {
        expo: "~55.0.0",
        "expo-constants": "~55.0.16",
        "expo-linking": "~55.0.15",
        "expo-router": "~55.0.5",
        "expo-status-bar": "~55.0.4",
        firebase: "^12.6.0",
        react: "19.2.0",
        "react-dom": "19.2.0",
        "react-native": "0.83.0",
        "react-native-safe-area-context": "~5.6.2",
        "react-native-screens": "~4.23.0",
        "react-native-web": "^0.21.0",
      },
      devDependencies: {
        "@babel/core": "^7.28.5",
        "@types/react": "^19.2.6",
        eslint: "^9.39.1",
        "eslint-config-expo": "^10.0.0",
        typescript: "^5.9.3",
      },
    },
    null,
    2,
  );
}

function expoAppJsonTemplate(projectName: string) {
  return JSON.stringify(
    {
      expo: {
        name: projectName,
        slug: projectName,
        scheme: projectName,
        version: "0.1.0",
        orientation: "portrait",
        userInterfaceStyle: "automatic",
        plugins: ["expo-router"],
        experiments: {
          typedRoutes: true,
        },
      },
    },
    null,
    2,
  );
}

function expoTsconfigTemplate() {
  return JSON.stringify(
    {
      extends: "expo/tsconfig.base",
      compilerOptions: {
        strict: true,
        baseUrl: ".",
        paths: {
          "@/*": ["./*"],
        },
      },
      include: ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"],
    },
    null,
    2,
  );
}

function t3StackFiles(projectName: string): GeneratedFile[] {
  return [
    ...nextTailwindFiles(projectName, {
      dependencies: {
        "@auth/prisma-adapter": "^2.11.1",
        "@prisma/client": "^6.19.0",
        "@trpc/client": "^11.7.2",
        "@trpc/next": "^11.7.2",
        "@trpc/server": "^11.7.2",
        "next-auth": "^5.0.0-beta.31",
      },
      devDependencies: {
        prisma: "^6.19.0",
      },
      scripts: {
        "db:generate": "prisma generate",
        "db:push": "prisma db push",
        "db:studio": "prisma studio",
      },
    }),
    {
      path: "src/server/trpc.ts",
      content: t3TrpcTemplate(),
    },
    {
      path: "src/server/routers/_app.ts",
      content: t3AppRouterTemplate(),
    },
    {
      path: "prisma/schema.prisma",
      content: t3PrismaSchemaTemplate(),
    },
    {
      path: "src/lib/auth.ts",
      content: t3AuthTemplate(),
    },
  ];
}

function t3TrpcTemplate() {
  return `import { initTRPC } from "@trpc/server";

export function createTRPCContext() {
  return {};
}

const t = initTRPC.context<Awaited<ReturnType<typeof createTRPCContext>>>().create();

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
`;
}

function t3AppRouterTemplate() {
  return `import { createTRPCRouter } from "@/server/trpc";

export const appRouter = createTRPCRouter({});

export type AppRouter = typeof appRouter;
`;
}

function t3PrismaSchemaTemplate() {
  return `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  sessions      Session[]
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
`;
}

function t3AuthTemplate() {
  return `import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import NextAuth from "next-auth";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [],
});
`;
}

function nextPrismaFiles(projectName: string): GeneratedFile[] {
  return [
    ...nextTailwindFiles(projectName, {
      dependencies: {
        "@prisma/client": "^6.19.0",
      },
      devDependencies: {
        prisma: "^6.19.0",
      },
      scripts: {
        "db:generate": "prisma generate",
        "db:push": "prisma db push",
        "db:studio": "prisma studio",
      },
    }),
    {
      path: "prisma/schema.prisma",
      content: nextPrismaSchemaTemplate(),
    },
    {
      path: "src/lib/prisma.ts",
      content: prismaClientTemplate(),
    },
  ];
}

function nextPrismaSchemaTemplate() {
  return `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
`;
}

function prismaClientTemplate() {
  return `import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
`;
}

function svelteKitTailwindFiles(projectName: string): GeneratedFile[] {
  return [
    {
      path: "svelte.config.js",
      content: svelteConfigTemplate(),
    },
    {
      path: "vite.config.ts",
      content: svelteViteConfigTemplate(),
    },
    {
      path: "tailwind.config.ts",
      content: svelteTailwindConfigTemplate(),
    },
    {
      path: "src/routes/+page.svelte",
      content: sveltePageTemplate(projectName),
    },
    {
      path: "src/routes/+layout.svelte",
      content: svelteLayoutTemplate(),
    },
    {
      path: "src/app.css",
      content: svelteAppCssTemplate(),
    },
    {
      path: "package.json",
      content: sveltePackageJsonTemplate(projectName),
    },
  ];
}

function svelteConfigTemplate() {
  return `import adapter from "@sveltejs/adapter-auto";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
  },
};

export default config;
`;
}

function svelteViteConfigTemplate() {
  return `import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [sveltekit()],
});
`;
}

function svelteTailwindConfigTemplate() {
  return `import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{html,js,svelte,ts}"],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
`;
}

function sveltePageTemplate(projectName: string) {
  return `<script lang="ts">
  const checklist = [
    "Set the product notes in README.md.",
    "Add any public values to .env.",
    "Keep agent-facing instructions short and current.",
  ];
</script>

<svelte:head>
  <title>${projectName}</title>
</svelte:head>

<main class="min-h-screen bg-zinc-950 px-6 py-16 text-zinc-100">
  <section class="mx-auto flex max-w-3xl flex-col gap-8">
    <div class="space-y-4">
      <p class="text-sm font-medium uppercase tracking-[0.2em] text-purple-300">
        Agent-ready starter
      </p>
      <h1 class="text-4xl font-semibold tracking-tight sm:text-6xl">
        ${projectName}
      </h1>
      <p class="max-w-2xl text-lg leading-8 text-zinc-300">
        SvelteKit, TypeScript, and Tailwind are wired up so you can start with
        the first real screen.
      </p>
    </div>

    <div class="rounded-lg border border-zinc-800 bg-zinc-900/70 p-6">
      <h2 class="text-lg font-medium">Before you build</h2>
      <ul class="mt-4 space-y-3 text-sm text-zinc-300">
        {#each checklist as item}
          <li class="flex gap-3">
            <span class="mt-1 h-2 w-2 rounded-full bg-purple-400"></span>
            <span>{item}</span>
          </li>
        {/each}
      </ul>
    </div>
  </section>
</main>
`;
}

function svelteLayoutTemplate() {
  return `<script lang="ts">
  import "../app.css";
</script>

<slot />
`;
}

function svelteAppCssTemplate() {
  return `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: dark;
}

body {
  margin: 0;
  background: rgb(9 9 11);
  color: rgb(244 244 245);
}
`;
}

function sveltePackageJsonTemplate(projectName: string) {
  return JSON.stringify(
    {
      name: projectName,
      version: "0.1.0",
      private: true,
      type: "module",
      scripts: {
        dev: "vite dev",
        build: "vite build",
        preview: "vite preview",
      },
      devDependencies: {
        "@sveltejs/adapter-auto": "^6.1.0",
        "@sveltejs/kit": "^2.48.6",
        "@sveltejs/vite-plugin-svelte": "^6.2.1",
        autoprefixer: "^10.4.22",
        postcss: "^8.5.6",
        svelte: "^5.43.14",
        tailwindcss: "^3.4.18",
        typescript: "^5.9.3",
        vite: "^7.2.4",
      },
    },
    null,
    2,
  );
}

function remixTailwindFiles(projectName: string): GeneratedFile[] {
  return [
    {
      path: "remix.config.js",
      content: remixConfigTemplate(),
    },
    {
      path: "tailwind.config.ts",
      content: remixTailwindConfigTemplate(),
    },
    {
      path: "app/root.tsx",
      content: remixRootTemplate(),
    },
    {
      path: "app/routes/_index.tsx",
      content: remixIndexTemplate(projectName),
    },
    {
      path: "app/tailwind.css",
      content: remixTailwindCssTemplate(),
    },
    {
      path: "package.json",
      content: remixPackageJsonTemplate(projectName),
    },
  ];
}

function remixConfigTemplate() {
  return `/** @type {import("@remix-run/dev").AppConfig} */
export default {
  ignoredRouteFiles: ["**/.*"],
};
`;
}

function remixTailwindConfigTemplate() {
  return `import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
`;
}

function remixRootTemplate() {
  return `import type { LinksFunction } from "@remix-run/node";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import type { ReactNode } from "react";
import stylesheet from "./tailwind.css";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
];

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
`;
}

function remixIndexTemplate(projectName: string) {
  return `const checklist = [
  "Write the product notes in README.md.",
  "Add server-only values to .env.",
  "Keep the first route focused on the main workflow.",
];

export default function Index() {
  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-16 text-zinc-100">
      <section className="mx-auto flex max-w-3xl flex-col gap-8">
        <div className="space-y-4">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-purple-300">
            Agent-ready starter
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
            ${projectName}
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-zinc-300">
            Remix, TypeScript, and Tailwind are ready. Start by shaping the
            route around the product task.
          </p>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-6">
          <h2 className="text-lg font-medium">Before you build</h2>
          <ul className="mt-4 space-y-3 text-sm text-zinc-300">
            {checklist.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-purple-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
`;
}

function remixTailwindCssTemplate() {
  return `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: dark;
}

body {
  margin: 0;
  background: rgb(9 9 11);
  color: rgb(244 244 245);
}
`;
}

function remixPackageJsonTemplate(projectName: string) {
  return JSON.stringify(
    {
      name: projectName,
      version: "0.1.0",
      private: true,
      type: "module",
      scripts: {
        dev: "remix dev",
        build: "remix build",
        start: "remix-serve ./build/server/index.js",
      },
      dependencies: {
        "@remix-run/node": "^2.17.0",
        "@remix-run/react": "^2.17.0",
        "@remix-run/serve": "^2.17.0",
        isbot: "^5.1.31",
        react: "^19.2.0",
        "react-dom": "^19.2.0",
      },
      devDependencies: {
        "@remix-run/dev": "^2.17.0",
        "@types/react": "^19.2.6",
        "@types/react-dom": "^19.2.3",
        autoprefixer: "^10.4.22",
        postcss: "^8.5.6",
        tailwindcss: "^3.4.18",
        typescript: "^5.9.3",
      },
    },
    null,
    2,
  );
}

function astroTailwindFiles(projectName: string): GeneratedFile[] {
  return [
    {
      path: "astro.config.mjs",
      content: astroConfigTemplate(),
    },
    {
      path: "tailwind.config.ts",
      content: astroTailwindConfigTemplate(),
    },
    {
      path: "src/pages/index.astro",
      content: astroIndexTemplate(projectName),
    },
    {
      path: "src/layouts/Layout.astro",
      content: astroLayoutTemplate(projectName),
    },
    {
      path: "package.json",
      content: astroPackageJsonTemplate(projectName),
    },
  ];
}

function astroConfigTemplate() {
  return `import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";

export default defineConfig({
  integrations: [tailwind()],
});
`;
}

function astroTailwindConfigTemplate() {
  return `import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
`;
}

function astroIndexTemplate(projectName: string) {
  return `---
import Layout from "../layouts/Layout.astro";

const checklist = [
  "Update README.md with the product brief.",
  "Add public environment values to .env.",
  "Keep the first page focused on real content.",
];
---

<Layout title="${projectName}">
  <main class="min-h-screen bg-zinc-950 px-6 py-16 text-zinc-100">
    <section class="mx-auto flex max-w-3xl flex-col gap-8">
      <div class="space-y-4">
        <p class="text-sm font-medium uppercase tracking-[0.2em] text-purple-300">
          Agent-ready starter
        </p>
        <h1 class="text-4xl font-semibold tracking-tight sm:text-6xl">
          ${projectName}
        </h1>
        <p class="max-w-2xl text-lg leading-8 text-zinc-300">
          Astro and Tailwind are ready. Replace this page with content that
          matches the project brief.
        </p>
      </div>

      <div class="rounded-lg border border-zinc-800 bg-zinc-900/70 p-6">
        <h2 class="text-lg font-medium">Before you build</h2>
        <ul class="mt-4 space-y-3 text-sm text-zinc-300">
          {
            checklist.map((item) => (
              <li class="flex gap-3">
                <span class="mt-1 h-2 w-2 rounded-full bg-purple-400" />
                <span>{item}</span>
              </li>
            ))
          }
        </ul>
      </div>
    </section>
  </main>
</Layout>
`;
}

function astroLayoutTemplate(projectName: string) {
  return `---
type Props = {
  title?: string;
};

const { title = "${projectName}" } = Astro.props;
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <meta name="description" content="Generated by AgentStack." />
    <title>{title}</title>
  </head>
  <body>
    <slot />
  </body>
</html>
`;
}

function astroPackageJsonTemplate(projectName: string) {
  return JSON.stringify(
    {
      name: projectName,
      version: "0.1.0",
      private: true,
      type: "module",
      scripts: {
        dev: "astro dev",
        build: "astro build",
        preview: "astro preview",
      },
      dependencies: {
        "@astrojs/tailwind": "^6.0.2",
        astro: "^5.15.4",
        tailwindcss: "^3.4.18",
      },
    },
    null,
    2,
  );
}

function withTrailingNewline(value: string) {
  return value.endsWith("\n") ? value : `${value}\n`;
}
