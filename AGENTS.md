# Repository Guidelines

## Project Structure & Module Organization
- pnpm + Turbo monorepo: `apps/web` holds the Next.js client (routes under `app/`, features in `modules/`).
- Reusable domains live in `packages/*` (`api`, `auth`, `database`, `payments`, etc.); treat exports there as canonical contracts.
- Standards, product docs, and automation reside in `docs/`, `features/`, and `scripts/`; check `docs/standards` before large changes.

## Build, Test, and Development Commands
- `pnpm install` – sync workspace deps; rerun after lockfile changes.
- `pnpm dev` – launch Turbo-powered development (Next runs with `next dev --turbo`).
- `pnpm build` – production build across packages with dotenv context.
- `pnpm lint`, `pnpm check`, `pnpm format` – Biome lint/format workflows; fix warnings before committing.
- `pnpm verify:local` – project-wide verification shim (lint, type-check, Playwright hooks).
- `pnpm --filter @repo/web e2e` / `e2e:ci` – run Playwright locally or in CI; install browsers with `pnpm exec playwright install` when needed.

## Coding Style & Naming Conventions
- TypeScript-first codebase with strict configs; annotate public APIs and shared utilities.
- React components use PascalCase filenames; hooks/helpers use camelCase. Collocate tests or stories within the module folder.
- Biome enforces formatting (two-space indent for TS/JSON) and organizes imports; avoid `any` and prefer shared zod schemas for validation.
- Environment config loads via `dotenv -c`; keep secrets in `.env.local` and document new variables in PRs.

## Testing Guidelines
- End-to-end tests live at `apps/web/tests/*.spec.ts`; name files after the user journey (`home.spec.ts`).
- Add unit or integration specs beside the feature (`*.test.ts`) when introducing new logic; register new commands in Turbo pipelines if required.
- Run `pnpm verify:local` plus targeted `pnpm --filter <package> type-check` before pushing to preserve cache health.

## Commit & Pull Request Guidelines
- Use conventional commit prefixes (`feat`, `fix`, `chore(scope)`, etc.), mirroring history like `feat: add migration plan`.
- PRs must outline problem, solution, and verification steps (screen captures for UI, command output for backend changes). Link roadmap issues or ADRs when relevant.
- Confirm CI, `pnpm validate:standards`, and required reviewers from package ownership docs before merging.

## Security & Configuration Tips
- Never commit secrets; rely on environment templates and secure backends for S3/Auth credentials.
- Apply least privilege when touching storage or auth packages and record notable decisions in `features/` or ADRs.
