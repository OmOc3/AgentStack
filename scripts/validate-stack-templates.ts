#!/usr/bin/env node

import { getStaticFiles, stackDefinitions } from "../src/lib/stacks";
import {
  formatStackTemplateValidationReport,
  validateStackTemplates,
} from "./lib/stack-template-validation";

const projectName = "agentstack-template-check";

const summary = validateStackTemplates({
  getFiles: (stack) => getStaticFiles(projectName, stack),
  stacks: stackDefinitions,
});

console.log(formatStackTemplateValidationReport(summary));

if (summary.issues.length > 0) {
  process.exitCode = 1;
}
