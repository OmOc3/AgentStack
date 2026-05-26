#!/usr/bin/env node

import { registerHooks } from "node:module";

registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (!isModuleResolutionError(error)) {
        throw error;
      }

      if (shouldTryTypeScriptFile(specifier)) {
        try {
          return nextResolve(`${specifier}.ts`, context);
        } catch (fileError) {
          if (!isModuleResolutionError(fileError)) {
            throw fileError;
          }
        }
      }

      if (shouldTryTypeScriptIndex(specifier)) {
        return nextResolve(`${specifier}/index.ts`, context);
      }

      throw error;
    }
  },
});

const stacksModule = (await import(
  new URL("../src/lib/stacks.ts", import.meta.url).href
)) as typeof import("../src/lib/stacks");
const validationModule = (await import(
  new URL("./lib/stack-template-validation.ts", import.meta.url).href
)) as typeof import("./lib/stack-template-validation");

const { getStaticFiles, stackDefinitions } = stacksModule;
const { formatStackTemplateValidationReport, validateStackTemplates } =
  validationModule;

const projectName = "agentstack-template-check";

const summary = validateStackTemplates({
  getFiles: (stack) => getStaticFiles(projectName, stack),
  stacks: stackDefinitions,
});

console.log(formatStackTemplateValidationReport(summary));

if (summary.issues.length > 0) {
  process.exitCode = 1;
}

function isModuleResolutionError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error.code === "ERR_MODULE_NOT_FOUND" ||
      error.code === "ERR_UNSUPPORTED_DIR_IMPORT")
  );
}

function shouldTryTypeScriptFile(specifier: string) {
  return specifier.startsWith(".") && !specifier.endsWith(".ts");
}

function shouldTryTypeScriptIndex(specifier: string) {
  return specifier.startsWith(".") && !specifier.endsWith(".ts");
}
