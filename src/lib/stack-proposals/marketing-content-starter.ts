import {
  finalizeProposalFiles,
  gitignoreTemplate,
  nextConfigTemplate,
  nextGlobalsTemplate,
  nextPackageJsonTemplate,
  nextTsconfigTemplate,
  postcssConfigTemplate,
  tailwindConfigTemplate,
} from "./common";
import type {
  GeneratedProposalFile,
  StackProposal,
  StackProposalDefinition,
} from "./types";

export const marketingContentStarterDefinition = {
  id: "marketing-content-starter",
  name: "Marketing Content Starter",
  description:
    "Next.js, Tailwind, SEO metadata, sitemap files, and a simple content model.",
  icon: "next",
} satisfies StackProposalDefinition;

export function buildMarketingContentStarterFiles(
  projectName: string,
): GeneratedProposalFile[] {
  return finalizeProposalFiles([
    {
      path: "README.md",
      content: readmeTemplate(projectName),
    },
    {
      path: ".env.example",
      content: envExampleTemplate(),
    },
    {
      path: ".gitignore",
      content: gitignoreTemplate(),
    },
    {
      path: "package.json",
      content: nextPackageJsonTemplate(projectName),
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
      path: "postcss.config.mjs",
      content: postcssConfigTemplate(),
    },
    {
      path: "tailwind.config.ts",
      content: tailwindConfigTemplate(),
    },
    {
      path: "src/app/globals.css",
      content: nextGlobalsTemplate(),
    },
    {
      path: "src/app/layout.tsx",
      content: layoutTemplate(projectName),
    },
    {
      path: "src/app/page.tsx",
      content: landingPageTemplate(projectName),
    },
    {
      path: "src/app/blog/page.tsx",
      content: blogIndexTemplate(),
    },
    {
      path: "src/app/blog/[slug]/page.tsx",
      content: blogPostTemplate(),
    },
    {
      path: "src/app/sitemap.ts",
      content: sitemapTemplate(),
    },
    {
      path: "src/app/robots.ts",
      content: robotsTemplate(),
    },
    {
      path: "src/content/posts.ts",
      content: contentTemplate(),
    },
  ]);
}

export const marketingContentStarterProposal = {
  definition: marketingContentStarterDefinition,
  buildFiles: buildMarketingContentStarterFiles,
} satisfies StackProposal;

function readmeTemplate(projectName: string) {
  return `# ${projectName}

Marketing site starter built with Next.js, Tailwind, SEO metadata, a sitemap route, robots settings, and a small typed content source.

## Getting started

~~~bash
npm install
cp .env.example .env.local
npm run dev
~~~

Open http://localhost:3000 for the landing page and http://localhost:3000/blog for the content index.

## Content

Sample posts live in \`src/content/posts.ts\`. Replace them with your real content or swap the module for MDX, a CMS, or a database when the publishing workflow needs it.

## SEO and sitemap

- Set \`NEXT_PUBLIC_SITE_URL\` in \`.env.local\` before deploying.
- Update the default title and description in \`src/app/layout.tsx\`.
- Add landing-page metadata in \`src/app/page.tsx\` when the page has a clear offer.
- Keep \`src/app/sitemap.ts\` in sync with any new routes that should be indexed.
- Keep private or work-in-progress routes out of \`sitemap.ts\`.

## Useful paths

- \`src/app/page.tsx\` - landing page
- \`src/app/blog/page.tsx\` - content index
- \`src/app/blog/[slug]/page.tsx\` - content detail page
- \`src/content/posts.ts\` - typed content placeholder
- \`src/app/sitemap.ts\` - sitemap entries
- \`src/app/robots.ts\` - crawler rules
`;
}

function envExampleTemplate() {
  return `NEXT_PUBLIC_SITE_URL="http://localhost:3000"
`;
}

function layoutTemplate(projectName: string) {
  return `import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "${projectName}",
    template: "%s | ${projectName}",
  },
  description:
    "A marketing site starter with typed content, sitemap, and metadata defaults.",
  openGraph: {
    title: "${projectName}",
    description:
      "A marketing site starter with typed content, sitemap, and metadata defaults.",
    url: siteUrl,
    siteName: "${projectName}",
    type: "website",
  },
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

function landingPageTemplate(projectName: string) {
  return `import type { Metadata } from "next";
import Link from "next/link";

import { posts } from "@/content/posts";

export const metadata: Metadata = {
  title: "Home",
  description:
    "A focused landing page with clear positioning and a content section.",
};

const proofPoints = [
  "Replace this with a concrete customer result.",
  "Link the CTA to the first action a visitor should take.",
  "Keep each section tied to a decision the visitor needs to make.",
];

export default function Home() {
  const featuredPosts = posts.slice(0, 2);

  return (
    <main className="bg-stone-50 text-zinc-950">
      <section className="border-b border-zinc-200 px-6 py-6">
        <nav className="mx-auto flex max-w-6xl items-center justify-between text-sm">
          <span className="font-semibold">${projectName}</span>
          <div className="flex items-center gap-5">
            <Link href="/blog" className="text-zinc-600 hover:text-zinc-950">
              Blog
            </Link>
            <a
              href="mailto:hello@example.com"
              className="rounded-md bg-zinc-950 px-3 py-2 font-medium text-white hover:bg-zinc-800"
            >
              Contact
            </a>
          </div>
        </nav>
      </section>

      <section className="px-6 py-20 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-zinc-500">
              Marketing starter
            </p>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
              A clear landing page, ready for real positioning.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-600">
              Swap the sample copy for your offer, audience, and proof. The
              SEO defaults and content routes are already in place.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="mailto:hello@example.com"
                className="rounded-md bg-zinc-950 px-4 py-3 text-center text-sm font-medium text-white hover:bg-zinc-800"
              >
                Start a conversation
              </a>
              <Link
                href="/blog"
                className="rounded-md border border-zinc-300 px-4 py-3 text-center text-sm font-medium hover:bg-white"
              >
                Read the blog
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold">Before publishing</h2>
            <ul className="mt-5 space-y-4 text-sm leading-6 text-zinc-600">
              {proofPoints.map((point) => (
                <li key={point} className="flex gap-3">
                  <span className="mt-2 h-2 w-2 rounded-full bg-sky-500" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-200 bg-white px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-zinc-500">
                Content
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                Notes from the team
              </h2>
            </div>
            <Link href="/blog" className="text-sm font-medium hover:underline">
              View all posts
            </Link>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {featuredPosts.map((post) => (
              <article
                key={post.slug}
                className="rounded-lg border border-zinc-200 p-5"
              >
                <p className="text-sm text-zinc-500">{post.publishedAt}</p>
                <h3 className="mt-3 text-xl font-semibold">{post.title}</h3>
                <p className="mt-3 text-sm leading-6 text-zinc-600">
                  {post.excerpt}
                </p>
                <Link
                  href={\`/blog/\${post.slug}\`}
                  className="mt-5 inline-flex text-sm font-medium hover:underline"
                >
                  Read post
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
`;
}

function blogIndexTemplate() {
  return `import type { Metadata } from "next";
import Link from "next/link";

import { posts } from "@/content/posts";

export const metadata: Metadata = {
  title: "Blog",
  description: "Product notes, launch updates, and practical customer stories.",
};

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-stone-50 px-6 py-12 text-zinc-950">
      <section className="mx-auto max-w-4xl">
        <Link href="/" className="text-sm font-medium text-zinc-600 hover:text-zinc-950">
          Back home
        </Link>
        <div className="mt-10">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-zinc-500">
            Blog
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Content placeholder
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-600">
            Use these sample posts to test layout, metadata, and sitemap output
            before connecting the final content source.
          </p>
        </div>

        <div className="mt-10 space-y-4">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm text-zinc-500">
                {post.publishedAt} · {post.readingTime}
              </p>
              <h2 className="mt-3 text-2xl font-semibold">{post.title}</h2>
              <p className="mt-3 text-sm leading-6 text-zinc-600">
                {post.excerpt}
              </p>
              <Link
                href={\`/blog/\${post.slug}\`}
                className="mt-5 inline-flex text-sm font-medium hover:underline"
              >
                Read post
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
`;
}

function blogPostTemplate() {
  return `import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import { getPostBySlug, posts } from "@/content/posts";

type BlogPostPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return {
      title: "Post not found",
    };
  }

  return {
    title: post.title,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-12 text-zinc-950">
      <article className="mx-auto max-w-3xl">
        <Link href="/blog" className="text-sm font-medium text-zinc-600 hover:text-zinc-950">
          Back to blog
        </Link>
        <header className="mt-10 border-b border-zinc-200 pb-8">
          <p className="text-sm text-zinc-500">
            {post.publishedAt} · {post.readingTime}
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">
            {post.title}
          </h1>
          <p className="mt-4 text-lg leading-8 text-zinc-600">
            {post.excerpt}
          </p>
        </header>

        <div className="mt-8 space-y-6 text-base leading-8 text-zinc-700">
          {post.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </article>
    </main>
  );
}
`;
}

function sitemapTemplate() {
  return `import type { MetadataRoute } from "next";

import { posts } from "@/content/posts";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/blog"].map((path) => ({
    url: new URL(path, siteUrl).toString(),
    lastModified: new Date(),
  }));
  const postRoutes = posts.map((post) => ({
    url: new URL(\`/blog/\${post.slug}\`, siteUrl).toString(),
    lastModified: new Date(post.publishedAt),
  }));

  return [...staticRoutes, ...postRoutes];
}
`;
}

function robotsTemplate() {
  return `import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
  };
}
`;
}

function contentTemplate() {
  return `export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  readingTime: string;
  body: string[];
};

export const posts: Post[] = [
  {
    slug: "writing-a-useful-launch-page",
    title: "Writing a useful launch page",
    excerpt:
      "A short checklist for replacing placeholder copy with sharper positioning.",
    publishedAt: "2026-01-12",
    readingTime: "4 min read",
    body: [
      "Start by naming the visitor and the moment that brought them to the page. A landing page gets easier to write when it has a specific reader.",
      "Keep the primary call to action tied to one next step. If the page needs three different actions, the offer may still be too broad.",
      "Use proof that a buyer can check. Screenshots, customer quotes, and direct examples work better than broad claims.",
    ],
  },
  {
    slug: "keeping-content-routes-simple",
    title: "Keeping content routes simple",
    excerpt:
      "How to keep a small content section maintainable before adding a CMS.",
    publishedAt: "2026-01-18",
    readingTime: "3 min read",
    body: [
      "A typed content file is enough for early marketing pages, release notes, and a handful of essays. It keeps review simple and avoids choosing a CMS too early.",
      "When publishing becomes frequent, move the same fields to MDX or a CMS and keep the route contract stable.",
      "The sitemap should follow the routes you actually want indexed. Leave drafts and private previews out until they are ready.",
    ],
  },
];

export function getPostBySlug(slug: string) {
  return posts.find((post) => post.slug === slug);
}
`;
}
