export const PROJECT_NAME_PATTERN = /^[a-zA-Z0-9-]+$/;
export const PROJECT_NAME_MAX_LENGTH = 100;

export function validateProjectName(projectName: string) {
  const trimmed = projectName.trim();

  if (!trimmed) {
    return "Enter a project name.";
  }

  if (trimmed.length > PROJECT_NAME_MAX_LENGTH) {
    return `Keep the project name under ${PROJECT_NAME_MAX_LENGTH} characters.`;
  }

  if (!PROJECT_NAME_PATTERN.test(trimmed)) {
    return "Use letters, numbers, and hyphens only.";
  }

  return null;
}
