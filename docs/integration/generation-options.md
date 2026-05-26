# Generation Options Integration

This module is ready to wire into the generator once the shared form, route, and GitHub files are safe to edit. Until then, existing requests can omit `generationOptions`; the domain module returns public visibility and the default AgentStack description.

## Form fields

In `src/components/GenerateForm.tsx`, import the shared types and limits:

```ts
import {
  DEFAULT_REPOSITORY_DESCRIPTION,
  DEFAULT_REPOSITORY_VISIBILITY,
  PROJECT_BRIEF_MAX_LENGTH,
  REPOSITORY_DESCRIPTION_MAX_LENGTH,
  validateRepositoryDescription,
  validateProjectBrief,
  validateRepositoryVisibility,
  type RepositoryVisibility,
} from "@/lib/generation-options";
```

Add local state beside the existing project and stack state:

```ts
const [repositoryVisibility, setRepositoryVisibility] =
  useState<RepositoryVisibility>(DEFAULT_REPOSITORY_VISIBILITY);
const [repositoryDescription, setRepositoryDescription] = useState<string>(
  DEFAULT_REPOSITORY_DESCRIPTION,
);
const [projectBrief, setProjectBrief] = useState<string>("");
```

Validate the fields before preview and generate:

```ts
function validateGenerationOptionsFields() {
  const visibilityError = validateRepositoryVisibility(repositoryVisibility);
  const descriptionError = validateRepositoryDescription(repositoryDescription);
  const briefError = validateProjectBrief(projectBrief);

  return visibilityError ?? descriptionError ?? briefError;
}
```

Call that helper in `handlePreview` and `handleSubmit` after the stack check:

```ts
const generationOptionsError = validateGenerationOptionsFields();

if (generationOptionsError) {
  setError(generationOptionsError);
  return;
}
```

Add the controls near the project name section. Clear `previewFiles` when any option changes because preview output can depend on these values.

```tsx
<section className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900/60 p-5 sm:p-6">
  <div>
    <h2 className="text-lg font-semibold text-zinc-100">Repository details</h2>
    <p className="mt-1 text-sm text-zinc-300">
      These settings are used when AgentStack creates the GitHub repo.
    </p>
  </div>

  <div>
    <label className="text-sm font-medium text-zinc-100" htmlFor="repositoryVisibility">
      Visibility
    </label>
    <select
      className="mt-2 h-12 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 text-zinc-100 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
      id="repositoryVisibility"
      onChange={(event) => {
        setRepositoryVisibility(event.target.value as RepositoryVisibility);
        setPreviewFiles(null);
      }}
      value={repositoryVisibility}
    >
      <option value="public">Public</option>
      <option value="private">Private</option>
    </select>
  </div>

  <div>
    <label className="text-sm font-medium text-zinc-100" htmlFor="repositoryDescription">
      Description
    </label>
    <input
      className="mt-2 h-12 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 text-zinc-100 outline-none transition placeholder:text-zinc-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
      id="repositoryDescription"
      maxLength={REPOSITORY_DESCRIPTION_MAX_LENGTH}
      onChange={(event) => {
        setRepositoryDescription(event.target.value);
        setPreviewFiles(null);
      }}
      placeholder={DEFAULT_REPOSITORY_DESCRIPTION}
      type="text"
      value={repositoryDescription}
    />
  </div>

  <div>
    <label className="text-sm font-medium text-zinc-100" htmlFor="projectBrief">
      Project brief
    </label>
    <textarea
      className="mt-2 min-h-28 w-full resize-y rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none transition placeholder:text-zinc-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
      id="projectBrief"
      maxLength={PROJECT_BRIEF_MAX_LENGTH}
      onChange={(event) => {
        setProjectBrief(event.target.value);
        setPreviewFiles(null);
      }}
      placeholder="A short note about what this app should do."
      value={projectBrief}
    />
  </div>
</section>
```

## Request body

Send the same `generationOptions` object to preview and generate:

```ts
const generationOptions = {
  visibility: repositoryVisibility,
  description: repositoryDescription,
  projectBrief,
};
```

Use it in both fetch calls:

```ts
body: JSON.stringify({
  projectName,
  stack,
  generationOptions,
}),
```

## Preview route

In `src/app/api/preview/route.ts`, add the new body field and normalize it after the stack check:

```ts
import { normalizeGenerationOptions } from "@/lib/generation-options";

type PreviewRequestBody = {
  projectName?: unknown;
  stack?: unknown;
  generationOptions?: unknown;
};

const generationOptionsResult = normalizeGenerationOptions(
  body.generationOptions,
);

if (!generationOptionsResult.ok) {
  return NextResponse.json(
    { error: generationOptionsResult.errors[0]?.message ?? "Check the generation options." },
    { status: 400 },
  );
}

const generationOptions = generationOptionsResult.options;
```

When `generateAgentFiles` supports briefs, pass `generationOptions.projectBrief?.content` into that function from both preview and generate.

## Generate route

In `src/app/api/generate/route.ts`, add the same body field and normalization:

```ts
import { normalizeGenerationOptions } from "@/lib/generation-options";

type GenerateRequestBody = {
  projectName?: unknown;
  stack?: unknown;
  generationOptions?: unknown;
};

const generationOptionsResult = normalizeGenerationOptions(
  body.generationOptions,
);

if (!generationOptionsResult.ok) {
  return NextResponse.json(
    { error: generationOptionsResult.errors[0]?.message ?? "Check the generation options." },
    { status: 400 },
  );
}

const generationOptions = generationOptionsResult.options;
```

Pass the normalized values into the GitHub helper:

```ts
const repoUrl = await createRepositoryWithFiles({
  description: generationOptions.description,
  files,
  projectName,
  token: session.accessToken,
  visibility: generationOptions.visibility,
});
```

## GitHub helper

In `src/lib/github.ts`, extend `createRepositoryWithFiles` so the normalized values reach Octokit:

```ts
import type { RepositoryVisibility } from "@/lib/generation-options";

export async function createRepositoryWithFiles({
  description,
  files,
  projectName,
  token,
  visibility,
}: {
  description: string;
  files: GeneratedFile[];
  projectName: string;
  token: string;
  visibility: RepositoryVisibility;
}) {
  const octokit = new Octokit({ auth: token });

  const repo = await octokit.repos.createForAuthenticatedUser({
    name: projectName,
    private: visibility === "private",
    auto_init: false,
    description,
  });
}
```
