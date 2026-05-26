const GITHUB_AUTH_ENV_NAMES = [
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
] as const;
const GOOGLE_AUTH_ENV_NAMES = [
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
] as const;
const PRODUCTION_GITHUB_AUTH_ENV_NAMES = [
  ...GITHUB_AUTH_ENV_NAMES,
  "NEXTAUTH_SECRET",
] as const;
const EMAIL_LOGIN_ENV_NAMES = ["EMAIL_LOGIN_CODE"] as const;
const AI_ENV_NAMES = ["GEMINI_API_KEY"] as const;
const APP_URL_ENV_NAME = "NEXTAUTH_URL";

export type AuthProviderStatus = {
  email: boolean;
  github: boolean;
  google: boolean;
};

export type ServerEnvStatus = {
  authConfigured: boolean;
  authProviders: AuthProviderStatus;
  aiConfigured: boolean;
  appUrlConfigured: boolean;
};

export function getRequiredEnv(name: string): string {
  const value = getOptionalEnv(name);

  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}.`);
  }

  return value;
}

export function getOptionalEnv(name: string): string | undefined {
  const value = process.env[name];

  if (value === undefined || value.trim() === "") {
    return undefined;
  }

  return value;
}

export function getServerEnvStatus(): ServerEnvStatus {
  const authProviders = getAuthProviderStatus();

  return {
    authConfigured: authProviders.github,
    authProviders,
    aiConfigured: hasAllEnv(AI_ENV_NAMES),
    appUrlConfigured: hasValidAppUrlEnv(),
  };
}

export function getAuthProviderStatus(): AuthProviderStatus {
  return {
    email: hasAllEnv(EMAIL_LOGIN_ENV_NAMES),
    github: hasAllEnv(getGitHubAuthEnvNames()),
    google: hasAllEnv(GOOGLE_AUTH_ENV_NAMES),
  };
}

export function assertGitHubAuthEnv(): void {
  assertRequiredEnvGroup(
    "GitHub auth",
    getMissingEnvNames(getGitHubAuthEnvNames()),
  );
}

export function assertAIEnv(): void {
  assertRequiredEnvGroup("AI provider", getMissingEnvNames(AI_ENV_NAMES));
}

export function assertAppUrlEnv(): void {
  const appUrl = getRequiredEnv(APP_URL_ENV_NAME);

  if (!isHttpUrl(appUrl)) {
    throw new Error(`${APP_URL_ENV_NAME} must be a valid HTTP or HTTPS URL.`);
  }
}

function getGitHubAuthEnvNames(): readonly string[] {
  if (process.env.NODE_ENV === "development") {
    return GITHUB_AUTH_ENV_NAMES;
  }

  return PRODUCTION_GITHUB_AUTH_ENV_NAMES;
}

function hasAllEnv(names: readonly string[]): boolean {
  return names.every((name) => getOptionalEnv(name) !== undefined);
}

function hasValidAppUrlEnv(): boolean {
  const appUrl = getOptionalEnv(APP_URL_ENV_NAME);

  return appUrl !== undefined && isHttpUrl(appUrl);
}

function getMissingEnvNames(names: readonly string[]): string[] {
  return names.filter((name) => getOptionalEnv(name) === undefined);
}

function assertRequiredEnvGroup(groupName: string, missingNames: string[]): void {
  if (missingNames.length === 0) {
    return;
  }

  throw new Error(
    `${groupName} is missing required environment variables: ${missingNames.join(", ")}.`,
  );
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
