# Repository Guidelines

## Project Structure & Module Organization
- Monorepo managed by `pnpm` + `turbo`.
- Apps: `apps/web` (Next.js 15 app, Playwright tests in `apps/web/tests`).
- Packages: reusable libraries under `packages/*` (published internally as `@repo/<name>`), e.g. `api`, `auth`, `database`, `i18n`, `mail`, `utils`.
- Config: shared runtime/types in `config/` (see `config/index.ts`, `config/types.ts`).
- Tooling: shared TypeScript and Tailwind presets in `tooling/typescript/*` and `tooling/tailwind/*`.

## Build, Test, and Development Commands
- Install: `pnpm install` (Node >= 20; packageManager pinned in `package.json`).
- Dev (all): `pnpm dev` (runs `turbo dev` with env via `dotenv`).
- Dev (single app): `pnpm --filter @repo/web dev`.
- Build: `pnpm build` (pipeline via Turbo + env). Start: `pnpm start`.
- Lint: `pnpm lint` (Biome). Format: `pnpm format`.
- E2E (UI): `pnpm --filter @repo/web e2e`. CI/headless: `pnpm --filter @repo/web e2e:ci`.
- Database codegen (if used): `pnpm --filter @repo/database generate`.

## Content & Docs
- Content Collections can be disabled if dev crashes in constrained envs:
  - Set `DISABLE_CONTENT_COLLECTIONS=1` in `apps/web/.env.local`.
  - Remove the var to re-enable live content generation.

## Coding Style & Naming Conventions
- Formatting/linting via Biome; respect `.editorconfig` (tabs, width 4, LF, final newline).
- Language: TypeScript strict (`tooling/typescript/base.json`). Prefer types over `any`.
- Naming: files `kebab-case.ts`; React components `PascalCase.tsx`; types/interfaces `PascalCase`; constants `UPPER_SNAKE_CASE`.
- Imports: prefer `@repo/<pkg>` aliases; avoid deep relative paths across package boundaries.

## Testing Guidelines
- Framework: Playwright in `apps/web` (`apps/web/playwright.config.ts`).
- Place specs under `apps/web/tests`, name `*.spec.ts`.
- Add/adjust E2E when changing routes, auth, or critical flows.
- Ensure `pnpm lint` and `pnpm --filter @repo/web e2e:ci` pass locally before PRs.

## Commit & Pull Request Guidelines
- Commits: follow Conventional Commits (e.g., `feat(web): add profile page`, `fix(auth): refresh token expiry`).
- PRs: include clear description, scope, and rationale; link issues; add screenshots for UI changes; note env/config impacts.
- Required checks: Biome (`pnpm lint`) and E2E run in CI (`.github/workflows/validate-prs.yml`). Keep PRs focused and small.

## Security & Configuration Tips
- Copy `.env.local.example` → `.env.local` and set secrets; never commit secrets.
- Env is injected via `dotenv` in scripts; verify required vars for features you touch (auth, storage, payments).
- Database uses Drizzle ORM; Prisma is not used.
