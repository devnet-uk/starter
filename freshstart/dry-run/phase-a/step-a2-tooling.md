# Phase A · Step A2 — Tooling & Automation Hardening (Dry Run)

## Original Plan Excerpt

> ### Step A2: Tooling & Automation Hardening
> ```claude
> Claude: /create-spec "Tooling hardening — TypeScript strict, Biome strict, Husky + lint-staged + commitlint, coverage >=98"
> Claude: /create-tasks
> Claude: /execute-tasks
> ```
>
> **Deliverables**
> - `tsconfig.base.json` aligned with strict mode and project references
> - `biome.json` enforcing repo-wide lint/format rules
> - Husky hooks for pre-commit (`pnpm lint && pnpm check`) and commit-msg (commitlint)
> - Coverage threshold configuration committed (Vitest/Jest/Bun equivalent)
>
> **Commit Point**
> ```bash
> git add tsconfig.base.json biome.json package.json .husky/ lint-staged.config.*
> git commit -m "chore(phase-a): tooling automation hardened"
> ```

## Dry-Run Command Plan

1. `Claude: /create-spec "Tooling hardening — TypeScript strict, Biome strict, Husky + lint-staged + commitlint, coverage >=98"`
   - Standards navigation: `typescript-config.md`, `biome-config.md`, `local-quality.md`, `testing-strategy.md`.
   - Variables: `PROJECT_PHASE=phase-a`, `PROJECT_COVERAGE=98`, `PACKAGE_MANAGER=pnpm`.
2. `Claude: /create-tasks`
   - Expected tasks:
    - Diff/update `tsconfig.base.json` for strict mode, project references, path aliases.
    - Ensure `biome.json` contains strict lint + format settings.
    - Configure Husky hooks (`.husky/pre-commit`, `.husky/commit-msg`) invoking repo lint/check scripts.
    - Update `package.json` scripts (`prepare`, lint/test coverage scripts) and `lint-staged` configuration.
    - Adjust coverage thresholds in Vitest/Jest config (`coverageThreshold`, or CLI flags) to ≥98.
    - Record tooling updates in ADR stub if necessary.
    - Note that `/execute-tasks` Step 6 will run the tooling verification suite from the standards.
3. `Claude: /execute-tasks`
   - Applies file edits, installs Husky hooks, and allows the verification runner to execute lint/check/coverage gates.

## Expected Outcome

- TypeScript strict mode enforced across workspace; path references validated.
- Biome configuration tightened with lint/format coverage.
- Husky and lint-staged wired, commitlint active; `package.json` contains `"prepare": "husky install"`.
- Coverage threshold raised to ≥98% in test tooling.
- ADR or notes capturing tooling decisions updated.
- Tooling verification reported green via `/execute-tasks`; Step A2 recorded in checkpoint and progress tracker.
- Commit prepared: `git add tsconfig.base.json biome.json package.json .husky/ lint-staged.config.*` with message `chore(phase-a): tooling automation hardened`.
