import {
  DEFAULT_REPOSITORY_DESCRIPTION,
  DEFAULT_REPOSITORY_VISIBILITY,
  type RepositoryVisibility,
} from "@/lib/generation-options";
import { createRepositoryWithInitialCommit } from "@/lib/github-bulk-writer";
import type { GeneratedFile } from "@/lib/stacks";

export async function createRepositoryWithFiles({
  description = DEFAULT_REPOSITORY_DESCRIPTION,
  files,
  projectName,
  token,
  visibility = DEFAULT_REPOSITORY_VISIBILITY,
}: {
  description?: string;
  files: GeneratedFile[];
  projectName: string;
  token: string;
  visibility?: RepositoryVisibility;
}) {
  const result = await createRepositoryWithInitialCommit({
    githubToken: token,
    repoName: projectName,
    description,
    private: visibility === "private",
    files,
  });

  return result.repositoryUrl;
}
