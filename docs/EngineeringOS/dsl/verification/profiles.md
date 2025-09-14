# Verification Profiles (Engineering OS)
<!-- Relocated from docs/standards/verification to docs/EngineeringOS/dsl/verification (authoring guidance) -->

Use profiles to tune strictness by project type and layer without duplicating tests. Profiles are applied via variables (e.g., `${PROJECT_TYPE}`, `${PROJECT_COVERAGE}`) and conditional tests.

## Profiles

### Greenfield (start strict)
- Variables: `PROJECT_TYPE=greenfield`, `PROJECT_COVERAGE=98`, `NODE_VERSION=22`, `PORT_WEB=4000`, `PORT_API=4001`.
- Blocking checks (must pass):
  - Scripts authenticity: real `lint/test/build/type-check/coverage` (no echo/true) and lint executes.
  - TypeScript strict: strict flags on; `npx tsc --noEmit` passes.
  - Biome domain strictness: `noExplicitAny` and `noNonNullAssertion` as error; `npx biome check .` passes.
  - Git hooks: `.husky/pre-commit` + `.husky/commit-msg` executable; commitlint config present.
  - Pre-push hook: `.husky/pre-push` exists and executable.
  - Monorepo essentials: `pnpm-workspace.yaml`, `turbo.json`, `.nvmrc` matches `${NODE_VERSION}`, `.env.example` present and includes `${PORT_WEB}`/`${PORT_API}`.
  - Testing: Vitest config or scripts; coverage threshold = `${PROJECT_COVERAGE}`; coverage reporters (html/json/lcov) configured.
  - Devcontainer: `.devcontainer/` exists with `devcontainer.json` (or yaml) and `docker-compose.yml`; ports configured.

### Standard (ramp quality)
- Variables: `PROJECT_TYPE=standard`, `PROJECT_COVERAGE=80` (raise later).
- Blocking checks: same as greenfield for basics (scripts authenticity, TS strict, Biome in domain, pre-commit/commit-msg hooks, monorepo essentials, coverage threshold presence).
- Advisory: pre-push hook, coverage reporters, devcontainer (can flip to required as maturity increases).

### Legacy (staged uplift)
- Variables: `PROJECT_TYPE=legacy`, `PROJECT_COVERAGE=70` (ratchet up per roadmap).
- Blocking checks: scripts authenticity, minimal TS sanity, monorepo essentials.
- Advisory: many checks start advisory; convert to blocking incrementally.

## Layer-Based Severity

- Domain/use-cases:
  - BLOCKING: TS strict + `tsc --noEmit`, Biome strict (noExplicitAny/noNonNullAssertion), coverage threshold.
- Infrastructure/UI:
  - BLOCKING: scripts authenticity; baseline TS.
  - ADVISORY: pre-push, coverage reporters, devcontainer (unless greenfield, where these are required).

## Implementation Pattern

- Gate tests with variables instead of duplicating:
```xml
<test name="coverage_reporters_configured">
  TEST: test "${PROJECT_TYPE}" != "greenfield" || ((test -f vitest.config.ts && grep -Ei "reporter[s]?:.*(html|json|lcov)" vitest.config.ts) || (test -f vitest.config.js && grep -Ei "reporter[s]?:.*(html|json|lcov)" vitest.config.js) || grep -Ei 'coverage.*(html|json|lcov)' package.json)
  REQUIRED: true
  BLOCKING: true
  VARIABLES: ["PROJECT_TYPE"]
  ERROR: "Coverage reporters not configured (required for greenfield)."
  FIX_COMMAND: "Add coverage.reporter: ['text','json','html','lcov'] to vitest.config.ts"
</test>
```

- Use `VARIABLES` in tests and ensure `verification-runner` substitutes values.
- Keep commands safe, non-destructive, and non-networked.

## Defaults Reference

- PROJECT_COVERAGE: 98 (greenfield), 80 (standard), 70 (legacy)
- PROJECT_TYPE: greenfield | standard | legacy
- NODE_VERSION: e.g., 22
- PORT_WEB/PORT_API: e.g., 4000/4001
