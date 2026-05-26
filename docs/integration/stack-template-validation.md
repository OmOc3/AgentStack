# Stack template validation

The validator lives at `scripts/validate-stack-templates.ts`. It imports the current stack registry, generates each template in memory, and checks for common production problems without writing template files or reading app runtime environment variables.

## npm script

The validator runs directly on Node 24, so it does not need a separate TypeScript script runner.

```json
{
  "scripts": {
    "validate:stacks": "node scripts/validate-stack-templates.ts"
  }
}
```

Run it locally with:

```bash
npm run validate:stacks
```

The command exits with `1` when any stack fails validation, so CI can call the same npm script.

## CI snippet

```yaml
- name: Validate generated stack templates
  run: npm run validate:stacks
```

## What it checks

- Every stack can generate files from the existing registry.
- Each template includes `README.md` and `package.json`.
- Templates that reference environment variables include a non-empty `.env.example` with those keys listed.
- Generated file paths are relative, normalized POSIX paths with no `.` or `..` segments.
- File paths are not duplicated, including case-only conflicts.
- `package.json` parses as JSON and contains the basic scripts expected for its framework.
- Generated file content is not empty.
