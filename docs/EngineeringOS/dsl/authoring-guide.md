# Standards Authoring Guide

Purpose: Help contributors write and maintain standards that are easy for AI agents to route and verify, with minimal drift and maximum determinism.

## REQUEST Phrasing Rules

Use one of the approved patterns exactly:
- "Get [content] from [relative-path]"
- "Get [content] from [relative-path]#[anchor]"
- "Get [category] routing from [dispatcher-path]"

Examples:
- REQUEST: "Get TypeScript style from code-style/typescript-style.md"
- REQUEST: "Get branch naming section from development/git-workflow.md#branch-naming"
- REQUEST: "Get architecture routing from architecture/architecture.md"

Notes:
- Paths are relative to `docs/standards/` and must exist.
- Anchors must match a heading slug in the target file.

## Anchor Naming Rules

- Headings should be descriptive; the anchor is the lowercase, hyphenated slug.
- Avoid ambiguous duplicates within a file (prefer adding a qualifier, e.g., `## Unit Tests (70%)` → `#unit-tests-70`).
- Prefer stable anchors; if you rename a heading, update all REQUESTs that reference it.

## Dispatcher and Standard Snippets

Dispatcher routing block:
```xml
<conditional-block task-condition="your-keywords|more-terms" context-check="unique-context-id">
IF current task involves [condition]:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get [content] from [relative-path]"
  </context_fetcher_strategy>
</conditional-block>
```

Standard file structure:
```markdown
# [Standard Title]

## Overview
Brief description of purpose and scope.

## Guidance
Actionable, example-driven guidance.

<!-- Optional: Related routing -->
<conditional-block task-condition="related-keywords" context-check="related-ctx-id">
IF related context required:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get related content from [relative-path]#[anchor]"
  </context_fetcher_strategy>
</conditional-block>
```

## context-check IDs

- Must be globally unique across the repo.
- Use descriptive, stable names (e.g., `git-branch-naming`, `verification-pre-commit-setup`).
- The validator will fail CI on duplicates.

## Verification Tests (Do/Don’t)

Do:
- Use safe, read-only commands: `test`, `grep`, `find`, `cat`, basic shell.
- Gate strict checks with variables (e.g., `${PROJECT_TYPE}`, `${PROJECT_COVERAGE}`).
- Provide `FIX_COMMAND` where safe and actionable.

Don’t:
- Use networked commands (`curl`, `wget`), package installs, or mutate repo state in TEST commands.
- Depend on `jq`/`yq`; JSON/YAML parsing is handled by the Node verification shim.

## Local Validation (Optional but Recommended)

Pre-commit example (Husky):
```bash
# .husky/pre-commit
. "$(dirname -- "$0")/_/husky.sh"
node scripts/validate-standards.mjs || exit 1
```

Manual run:
```bash
node scripts/validate-standards.mjs
```

Verification shim (ad-hoc):
```bash
node scripts/verification-shim.mjs --files=docs/standards/development/git-workflow.md --mode=blocking
```

## Change Checklist

- Routing: Accessible in ≤3 hops from `standards.md`.
- Conditions: Task-condition keywords specific and mapped to lexicon.
- Anchors: All referenced anchors exist and are stable.
- Purity: Dispatchers contain only routing blocks and comments.
- Verifications: Safe TEST commands, clear ERROR/FIX_COMMAND, correct VARIABLES.

## Templates

- Dispatcher template: `docs/EngineeringOS/dsl/templates/dispatcher-template.md`
- Standard template: `docs/EngineeringOS/dsl/templates/standard-template.md`
